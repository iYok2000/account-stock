import LayoutWithSidebar from "./LayoutWithSidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}
