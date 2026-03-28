import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // Get or create user
  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    // Auto-create user from Clerk if webhook hasn't fired yet
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();

    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

      user = await prisma.user.upsert({
        where: { clerkId },
        update: {},
        create: {
          clerkId,
          email,
          name,
          imageUrl: clerkUser.imageUrl,
          role: email === process.env.ADMIN_EMAIL ? "ADMIN" : "CITIZEN",
        },
      });
    } else {
      redirect("/sign-in");
    }
  }

  // Redirect admin to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="CITIZEN" userName={user.name} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
