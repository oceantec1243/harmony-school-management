"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Erreur d&apos;authentification</CardTitle>
            <CardDescription>
              Une erreur est survenue lors de la connexion. Veuillez reessayer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/auth/login">Retour a la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
