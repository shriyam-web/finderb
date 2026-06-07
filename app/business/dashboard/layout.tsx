export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="merchant-dashboard min-h-screen font-sans antialiased">
      {children}
    </div>
  );
}
