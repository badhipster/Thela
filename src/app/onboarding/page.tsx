'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { X, Plus, Minus, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HouseholdMember {
  name: string
  age_band: 'Child' | 'Adult' | 'Senior'
  diet: 'Veg' | 'Eggetarian' | 'Non-veg'
}

interface FormData {
  members: HouseholdMember[]
  city: string
  home_dinners_per_week: number
  cuisine_tilt: string
  spice_level: string
  paneer_brand: string
  atta_brand: string
  dahi_default_size: number
  notes: string
}

const defaultMember: HouseholdMember = { name: '', age_band: 'Adult', diet: 'Veg' }

const initialFormData: FormData = {
  members: [{ ...defaultMember }],
  city: 'Bengaluru',
  home_dinners_per_week: 5,
  cuisine_tilt: 'South Indian',
  spice_level: 'Medium',
  paneer_brand: '',
  atta_brand: '',
  dahi_default_size: 400,
  notes: '',
}

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingExisting, setCheckingExisting] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Check if user already has a household — if so, redirect
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: household } = await supabase
        .from('households')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (household) {
        router.replace('/basket')
        return
      }
      setCheckingExisting(false)
    }
    check()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function updateMember(index: number, field: keyof HouseholdMember, value: string) {
    setForm((prev) => {
      const members = [...prev.members]
      members[index] = { ...members[index], [field]: value }
      return { ...prev, members }
    })
  }

  function addMember() {
    setForm((prev) => ({
      ...prev,
      members: [...prev.members, { ...defaultMember }],
    }))
  }

  function removeMember(index: number) {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }))
  }

  function adjustDinners(delta: number) {
    setForm((prev) => ({
      ...prev,
      home_dinners_per_week: Math.max(0, Math.min(7, prev.home_dinners_per_week + delta)),
    }))
  }

  // Validation
  function validateStep1(): string | null {
    if (form.members.some((m) => !m.name.trim())) return 'Every household member needs a name.'
    if (!form.city) return 'Please select your city.'
    return null
  }

  function handleNext() {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    setError(null)
    setStep((s) => s + 1)
  }

  function handleBack() {
    setError(null)
    setStep((s) => s - 1)
  }

  async function handleFinish() {
    setError(null)
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session expired. Please log in again.')

      // Compute majority diet
      const dietCounts: Record<string, number> = {}
      for (const m of form.members) {
        dietCounts[m.diet] = (dietCounts[m.diet] || 0) + 1
      }
      const dietDefault = Object.entries(dietCounts).sort((a, b) => b[1] - a[1])[0][0].toLowerCase().replace('-', '_')

      // 1. Insert user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          name: form.members[0].name.trim(),
          phone: null,
          city: form.city,
        }, { onConflict: 'user_id' })

      if (profileError) throw new Error(`Profile: ${profileError.message}`)

      // 2. Insert households
      const { error: householdError } = await supabase
        .from('households')
        .insert({
          user_id: user.id,
          members: form.members.map((m) => ({
            name: m.name.trim(),
            age_band: m.age_band.toLowerCase(),
            diet: m.diet.toLowerCase().replace('-', '_'),
          })),
          diet_default: dietDefault,
          cooking_pattern: {
            home_dinners_per_week: form.home_dinners_per_week,
            cuisine_tilt: form.cuisine_tilt.toLowerCase().replace(/ /g, '_'),
            spice_level: form.spice_level.toLowerCase(),
          },
          staple_preferences: {
            paneer_brand: form.paneer_brand.trim() || null,
            atta_brand: form.atta_brand.trim() || null,
            dahi_default_size: form.dahi_default_size,
          },
          notes: form.notes.trim() || null,
        })

      if (householdError) throw new Error(`Household: ${householdError.message}`)

      router.push('/basket')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-xs text-muted-foreground tracking-wide mb-2">
            Step {step} of 3
          </p>

          {step === 1 && (
            <>
              <CardTitle className="text-xl">Who&apos;s in your household?</CardTitle>
              <CardDescription>This helps Thela plan baskets that fit your family.</CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle className="text-xl">How do you cook?</CardTitle>
              <CardDescription>A quick sense of your weekly rhythm.</CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle className="text-xl">Any preferences we should know?</CardTitle>
              <CardDescription>All optional. You can edit these anytime.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── STEP 1: Household basics ─────────────────────────── */}
          {step === 1 && (
            <>
              <div className="space-y-4">
                {form.members.map((member, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <Input
                          id={`member-name-${i}`}
                          value={member.name}
                          onChange={(e) => updateMember(i, 'name', e.target.value)}
                          placeholder="Name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Age</Label>
                        <Select
                          value={member.age_band}
                          onValueChange={(v) => updateMember(i, 'age_band', v)}
                        >
                          <SelectTrigger className="mt-1" id={`member-age-${i}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Child">Child</SelectItem>
                            <SelectItem value="Adult">Adult</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Diet</Label>
                        <Select
                          value={member.diet}
                          onValueChange={(v) => updateMember(i, 'diet', v)}
                        >
                          <SelectTrigger className="mt-1" id={`member-diet-${i}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Veg">Veg</SelectItem>
                            <SelectItem value="Eggetarian">Eggetarian</SelectItem>
                            <SelectItem value="Non-veg">Non-veg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {i > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 shrink-0"
                        onClick={() => removeMember(i)}
                        aria-label="Remove member"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  className="w-full"
                  id="add-member-btn"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add another
                </Button>
              </div>

              <div>
                <Label htmlFor="city">Your city</Label>
                <Select value={form.city} onValueChange={(v) => setForm((f) => ({ ...f, city: v }))}>
                  <SelectTrigger className="mt-1" id="city">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* ── STEP 2: Cooking pattern ──────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <Label>How many dinners at home in a typical week?</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustDinners(-1)}
                    disabled={form.home_dinners_per_week <= 0}
                    id="dinners-minus"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-semibold w-8 text-center tabular-nums">
                    {form.home_dinners_per_week}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustDinners(1)}
                    disabled={form.home_dinners_per_week >= 7}
                    id="dinners-plus"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Cuisine tilt</Label>
                <RadioGroup
                  value={form.cuisine_tilt}
                  onValueChange={(v) => setForm((f) => ({ ...f, cuisine_tilt: v }))}
                  className="mt-2 space-y-2"
                >
                  {['North Indian', 'South Indian', 'Mixed', 'Other'].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`cuisine-${opt}`} />
                      <Label htmlFor={`cuisine-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Spice level</Label>
                <RadioGroup
                  value={form.spice_level}
                  onValueChange={(v) => setForm((f) => ({ ...f, spice_level: v }))}
                  className="mt-2 space-y-2"
                >
                  {['Mild', 'Medium', 'High'].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`spice-${opt}`} />
                      <Label htmlFor={`spice-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* ── STEP 3: Staple preferences ───────────────────────── */}
          {step === 3 && (
            <>
              <div>
                <Label htmlFor="paneer-brand">Paneer brand preference</Label>
                <Input
                  id="paneer-brand"
                  value={form.paneer_brand}
                  onChange={(e) => setForm((f) => ({ ...f, paneer_brand: e.target.value }))}
                  placeholder="e.g., Milky Mist, Amul, no preference"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="atta-brand">Atta brand</Label>
                <Input
                  id="atta-brand"
                  value={form.atta_brand}
                  onChange={(e) => setForm((f) => ({ ...f, atta_brand: e.target.value }))}
                  placeholder="e.g., Aashirvaad, Fortune"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dahi-size">Dahi default size (g)</Label>
                <Input
                  id="dahi-size"
                  type="number"
                  min={100}
                  max={1000}
                  step={100}
                  value={form.dahi_default_size}
                  onChange={(e) => setForm((f) => ({ ...f, dahi_default_size: Number(e.target.value) || 400 }))}
                  className="mt-1 w-32"
                />
              </div>

              <div>
                <Label htmlFor="notes">Anything else we should know?</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="In-laws visit Thursdays, kid allergic to peanuts, etc."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* ── Error display ─────────────────────────────────── */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* ── Navigation ────────────────────────────────────── */}
          <div className="flex justify-between pt-2">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={handleBack} disabled={submitting}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" onClick={handleNext} id="onboarding-next-btn">
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                id="onboarding-finish-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Finish'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
