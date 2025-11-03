import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-semibold">Transpiaggio Sacco Kitale</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted partner in savings and credit cooperative services.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>+254 xxx xxx xxx</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-secondary" />
                <span>info@transpiaggiosacco.co.ke</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-tertiary" />
                <span>Kitale Town</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                About Us
              </a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                Services
              </a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Transpiaggio Sacco Kitale. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
