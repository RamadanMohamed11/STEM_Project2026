import { Link } from 'react-router'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.to ? (
              <Link
                to={item.to}
                className="inline-flex min-h-11 items-center rounded px-1 text-teal-dark hover:underline focus-visible:outline-teal"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current={index === items.length - 1 ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
