import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="ADMIN" userName={user.name} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
