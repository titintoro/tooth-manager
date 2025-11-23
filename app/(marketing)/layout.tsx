import { ReactNode } from 'react'
import { MarketingNav } from '@/components/marketing-nav'

export default function MarketingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      
      <main className="flex-1">{children}</main>
      
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Tooth Manager</h3>
              <p className="text-sm text-muted-foreground">
                Optimiza la agenda de tu clínica dental con IA
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/#features" className="hover:text-foreground">Características</a></li>
                <li><a href="/precios" className="hover:text-foreground">Precios</a></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/contacto" className="hover:text-foreground">Contacto</a></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacidad" className="hover:text-foreground">Privacidad</a></li>
                <li><a href="/terminos" className="hover:text-foreground">Términos</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 Tooth Manager. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
