'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
        <CardDescription>
          Something went wrong during authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            We couldn&apos;t complete your authentication request. This could be due to an expired link or an invalid token.
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">What you can do:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Try logging in again</li>
            <li>Request a new verification email</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button asChild className="w-full">
          <Link href="/login">Back to Login</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/signup">Create New Account</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
