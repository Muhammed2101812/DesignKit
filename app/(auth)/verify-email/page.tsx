'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you a verification link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="text-sm font-medium">
            Please check your inbox and click the verification link to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, check your spam folder.
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">What happens next?</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Click the verification link in your email</li>
            <li>You&apos;ll be redirected to the welcome screen</li>
            <li>Start using Design Kit tools</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Already verified?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Login to your account
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
