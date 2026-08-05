import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  // Obter página do usuário logado
  const page = await prisma.page.findUnique({
    where: { userId: user.id }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold">Configurações do Perfil</h2>
        <p className="text-sm text-muted-foreground">Gerencie suas credenciais de login e a aparência de sua página de relatórios públicos.</p>
      </div>

      <SettingsForm 
        initialUser={{ name: user.name, email: user.email }}
        initialPage={{
          publicName: page?.publicName || "",
          bio: page?.bio || "",
          username: page?.username || "",
          avatarUrl: page?.avatarUrl || ""
        }}
      />
    </div>
  );
}
