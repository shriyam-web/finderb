export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="merchant-dashboard merchant-dashboard-canvas min-h-screen font-sans antialiased">
      {children}
    </div>
  );
}
