import { filterExperiments, initialCatalogFilters } from './catalogSelectors.ts'
import type { CatalogData, CatalogFilters } from './catalogSelectors.ts'
import { resolveAcademicFilters } from '../../curriculum/lib/curriculumDiscovery.ts'
import { getCurriculumLessonContext } from '../../curriculum/lib/curriculumBrowser.ts'

const queryKeys = {
  search: 'q',
  categoryId: 'category',
  status: 'status',
  semesterId: 'semester',
  gradeId: 'grade',
  termId: 'term',
  unitId: 'unit',
  lessonId: 'lesson',
} as const

export function readCatalogFilters(params: URLSearchParams, data: CatalogData) {
  const filters = { ...initialCatalogFilters }
  for (const field of Object.keys(queryKeys) as (keyof CatalogFilters)[]) {
    const value = params.get(queryKeys[field])
    if (value !== null) Object.assign(filters, { [field]: value })
  }
  const invalid =
    Object.values(queryKeys).some((key) => params.getAll(key).length > 1) ||
    !['all', 'demo', 'planned'].includes(filters.status) ||
    (filters.categoryId !== 'all' &&
      !data.categories.some((item) => item.id === filters.categoryId)) ||
    (filters.semesterId !== 'all' &&
      !data.semesters.some((item) => item.id === filters.semesterId)) ||
    resolveAcademicFilters(data.curriculum, filters).invalid
  return { filters, invalid }
}

export function catalogSearchParams(filters: CatalogFilters) {
  const params = new URLSearchParams()
  for (const field of Object.keys(queryKeys) as (keyof CatalogFilters)[])
    if (filters[field] !== initialCatalogFilters[field])
      params.set(queryKeys[field], filters[field])
  return params
}

export function catalogResultsPath(pathname: string, filters: CatalogFilters) {
  const query = catalogSearchParams(filters).toString()
  return `${pathname}${query ? `?${query}` : ''}`
}

/** Only validated local results pages can be used as return destinations. */
export function resolveResultsReturn(
  value: string | null,
  experimentId: string,
  catalog: CatalogData,
): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return null
  let url: URL
  try {
    url = new URL(value, 'https://local.invalid')
  } catch {
    return null
  }
  if (url.origin !== 'https://local.invalid' || url.hash) return null
  let data = catalog
  if (url.pathname !== '/experiments') {
    const match = /^\/curriculum\/lessons\/([^/]+)$/.exec(url.pathname)
    if (!match || !catalog.curriculum) return null
    let lessonId: string
    try {
      lessonId = decodeURIComponent(match[1])
    } catch {
      return null
    }
    // The same academic filtering engine verifies that the experiment belongs to this lesson.
    const context = getCurriculumLessonContext(catalog.curriculum, lessonId)
    if (!context) return null
    const scope = {
      ...initialCatalogFilters,
      gradeId: context.grade.id,
      termId: context.term.id,
      unitId: context.unit.id,
      lessonId,
    }
    data = { ...catalog, experiments: filterExperiments(catalog, scope), curriculum: undefined }
  }
  const { filters, invalid } = readCatalogFilters(url.searchParams, data)
  if (invalid || !filterExperiments(data, filters).some((item) => item.id === experimentId))
    return null
  return catalogResultsPath(url.pathname, filters)
}
