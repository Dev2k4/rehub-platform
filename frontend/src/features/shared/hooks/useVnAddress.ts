import { useEffect, useMemo, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────
export type VnWard = {
  name: string
  code: number
  codename: string
  division_type: string
}

export type VnProvince = {
  name: string
  code: number
  codename: string
  division_type: string
  wards: VnWard[]
}

// ─── API ──────────────────────────────────────────────────────────
const VN_API_BASE = "https://provinces.open-api.vn/api/v2"

// Cache to avoid refetching across components
let cachedProvinces: VnProvince[] | null = null
let provincesFetchPromise: Promise<VnProvince[]> | null = null

async function fetchProvinces(): Promise<VnProvince[]> {
  if (cachedProvinces) return cachedProvinces
  if (provincesFetchPromise) return provincesFetchPromise

  provincesFetchPromise = fetch(`${VN_API_BASE}/`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch provinces")
      return res.json()
    })
    .then((data: VnProvince[]) => {
      cachedProvinces = data
      return data
    })

  return provincesFetchPromise
}

// Per-province ward cache
const wardCache = new Map<number, VnWard[]>()

async function fetchProvinceWards(provinceCode: number): Promise<VnWard[]> {
  if (wardCache.has(provinceCode)) return wardCache.get(provinceCode)!

  const res = await fetch(`${VN_API_BASE}/p/${provinceCode}?depth=2`)
  if (!res.ok) throw new Error("Failed to fetch wards")
  const data = await res.json()
  const wards: VnWard[] = data.wards ?? []
  wardCache.set(provinceCode, wards)
  return wards
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useVnAddress(selectedProvinceName: string | undefined) {
  const [provinces, setProvinces] = useState<VnProvince[]>(cachedProvinces ?? [])
  const [wards, setWards] = useState<VnWard[]>([])
  const [provincesLoading, setProvincesLoading] = useState(!cachedProvinces)
  const [wardsLoading, setWardsLoading] = useState(false)

  // Fetch provinces
  useEffect(() => {
    if (cachedProvinces) {
      setProvinces(cachedProvinces)
      setProvincesLoading(false)
      return
    }

    setProvincesLoading(true)
    fetchProvinces()
      .then(setProvinces)
      .catch(console.error)
      .finally(() => setProvincesLoading(false))
  }, [])

  // Find province code from name
  const selectedProvinceCode = useMemo(() => {
    if (!selectedProvinceName) return null
    return provinces.find((p) => p.name === selectedProvinceName)?.code ?? null
  }, [selectedProvinceName, provinces])

  // Fetch wards when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([])
      return
    }

    setWardsLoading(true)
    fetchProvinceWards(selectedProvinceCode)
      .then(setWards)
      .catch(console.error)
      .finally(() => setWardsLoading(false))
  }, [selectedProvinceCode])

  // Memoized option lists
  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ label: p.name, value: p.name })),
    [provinces],
  )

  const wardOptions = useMemo(
    () => wards.map((w) => ({ label: w.name, value: w.name })),
    [wards],
  )

  return {
    provinces,
    wards,
    provincesLoading,
    wardsLoading,
    provinceOptions,
    wardOptions,
  }
}
