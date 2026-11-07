import { useLocation, useSearchParams } from 'react-router'
import { catalogResultsPath, catalogSearchParams, readCatalogFilters } from './catalogUrlState'
import { filterExperiments, initialCatalogFilters } from './catalogSelectors'
import type { CatalogData, CatalogFilters } from './catalogSelectors'

export function useCatalogSearch(data: CatalogData) {
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const { filters, invalid } = readCatalogFilters(params, data)
  return {
    filters,
    invalid,
    results: invalid ? [] : filterExperiments(data, filters),
    hasFilters: params.toString() !== '',
    onChange: (next: CatalogFilters) =>
      setParams(catalogSearchParams(next), { preventScrollReset: true }),
    onClear: () =>
      setParams(catalogSearchParams(initialCatalogFilters), { preventScrollReset: true }),
    resultsPath: catalogResultsPath(pathname, filters),
  }
}
