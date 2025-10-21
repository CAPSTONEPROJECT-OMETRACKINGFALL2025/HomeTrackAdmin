// app/login/page.tsx

import LoginForm from "@/components/auth/SignInForm";


export const metadata = {
  title: "Login | HomeTrack Admin",
};

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-gradient-to-br from-orange-500 via-orange-400 to-orange-300 p-4">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-6xl grid-cols-1 items-center gap-8 rounded-3xl
      md:grid-cols-2 lg:p-10">
        <section className="hidden md:block">
          <div className="rounded-3xl">
            <h2 className="text-5xl font-black tracking-tight text-white">Home Track</h2>
            <p className="mt-4 max-w-md text-lg text-white/90">
              Sắp xếp & định vị đồ đạc một cách dễ dàng. Quản lý phòng, tủ, ngăn kéo…
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
