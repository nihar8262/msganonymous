import Navbar from "@/components/navbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar/>
      <div className="flex-1 pt-10">
        {children}
      </div>
    </div>
  );
}
