import SignUpForm from "@/components/auth/SignUpForm";

export const metadata = {
  title: "Register | HomeTrack Admin",
  description: "Create an account for HomeTrack Admin",
};

export default function RegisterPage() {
  return (
    <main className="bg-gradient-to-br from-orange-500 via-orange-400 to-orange-300 p-4">
      <div
        className="mx-auto grid min-h-0 max-w-6xl grid-cols-1 items-stretch gap-8
        md:grid-cols-2 lg:p-10"
      >
        {/* Brand / marketing */}
        <section className="hidden md:flex overflow-hidden">
          <div className="flex w-full flex-col justify-center rounded-3xl">
            <h2 className="text-5xl font-black tracking-tight text-white">Chào mừng!</h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">
              Tham gia Home Track để quản lý vị trí đồ đạc gọn nhẹ, thông minh.
            </p>
            <ul className="mt-6 space-y-3 text-white/90">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="text-sm lg:text-base">Tổ chức theo phòng/kệ/ngăn</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="text-sm lg:text-base">Tìm kiếm và lọc thông minh</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="text-sm lg:text-base">Ảnh minh họa và gợi ý</span>
              </li>
            </ul>
            <div className="mt-8 h-32 rounded-2xl border border-white/30 bg-white/10 shadow-inner" />
          </div>
        </section>

        {/* Form side: cho phép cuộn nội bộ nếu màn hình thấp */}
          <div className=" w-full">
            <SignUpForm />
          </div>
      </div>
    </main>
  );
}
