// app/login/page.tsx
import SignInForm from "@/components/auth/SignInForm";
import Link from "next/link";

export const metadata = {
  title: "Login | HomeTrack Admin",
  description: "Sign in to HomeTrack Admin",
};

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-gradient-to-br from-orange-500 via-orange-400 to-orange-300 p-4">
      {/* Top-right back/home (optional) */}
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="float-right mb-3 inline-flex items-center gap-2 rounded-xl"
        >
          <span aria-hidden>⌂</span> Về trang chủ
        </Link>
      </div>

      <div
        className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl grid-cols-1 items-stretch gap-8 rounded-3xl 
        md:grid-cols-2 lg:p-10"
      >
        {/* Marketing / Brand side */}
        <section className="hidden md:flex">
          <div className="flex w-full flex-col justify-center rounded-3xl  p-8 ">
            <h2 className="text-5xl font-black tracking-tight text-white">Home Track</h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">
              Sắp xếp &amp; định vị đồ đạc một cách dễ dàng. Quản lý phòng, tủ, ngăn kéo…
            </p>

            <ul className="mt-6 space-y-3 text-white/90">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="text-sm lg:text-base">Ghi nhớ vị trí đồ đạc chính xác</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="text-sm lg:text-base">Tìm kiếm nhanh theo phòng/kệ/ngăn</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="text-sm lg:text-base">Đồng bộ đa thiết bị, bảo mật an toàn</span>
              </li>
            </ul>

            <div className="mt-8 h-36 rounded-2xl border border-white/30 bg-white/10 shadow-inner" />
            <p className="mt-2 text-xs text-white/70">
              *Hình minh họa module quản lý phòng/kệ.
            </p>
          </div>
        </section>

        {/* Form side */}
        <section className="flex items-center justify-center">
          <SignInForm />
        </section>
      </div>

      {/* Footer tiny note */}
      <div className="mx-auto max-w-6xl pt-4 text-center text-xs text-white/80">
        © {new Date().getFullYear()} HomeTrack. All rights reserved.
      </div>
    </main>
  );
}
