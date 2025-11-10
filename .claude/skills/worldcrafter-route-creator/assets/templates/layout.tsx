export default function LayoutName({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="layout-container">
      {/* Shared UI - navigation, sidebar, etc. */}
      <nav className="border-b">
        {/* Navigation items */}
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t">
        {/* Footer content */}
      </footer>
    </div>
  )
}
