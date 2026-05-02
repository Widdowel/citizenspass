import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DOC_TYPES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, QrCode } from "lucide-react";
import Link from "next/link";

export default async function DocumentsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string })?.id;

  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
          <p className="text-gray-500 mt-1">
            Documents officiels disponibles au telechargement
          </p>
        </div>
        <Link href="/dashboard/request-new">
          <Button className="bg-[#008751] hover:bg-[#006b41]">
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucun document disponible
            </h3>
            <p className="text-gray-400 mb-6">
              Vos documents apparaitront ici une fois vos demandes approuvees.
            </p>
            <Link href="/dashboard/request-new">
              <Button className="bg-[#008751] hover:bg-[#006b41]">
                Faire une demande
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#008751]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#008751]" />
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Valide
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{doc.title}</h3>
                <p className="text-sm text-gray-500 mb-1">
                  {DOC_TYPES[doc.type] || doc.type}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Emis le {new Date(doc.issuedAt).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-[#008751] hover:bg-[#006b41]">
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Link href={`/verify?code=${doc.qrCode}`}>
                    <Button size="sm" variant="outline">
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
