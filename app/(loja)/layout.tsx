import { CartDrawer, FloatingWhatsApp, Footer, Header } from '@/components/store/chrome'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="conteudo">{children}</main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
    </>
  )
}
