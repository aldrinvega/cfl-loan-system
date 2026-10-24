import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { COMPANY_NAME, users } from '@/data/sample'
import type { User } from '@/data/types'
import { useAuth } from '@/state/auth'
import { useSettings } from '@/state/settings'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'

const roleText: Record<User['role'], string> = {
  accounting: 'Accounting officer · Sindalan Branch',
  loan_officer: 'Loan officer · Sindalan Branch',
  president: 'President · all branches',
  collector: 'Collector 03 · phone, view only',
}

function destination(home: string, from: string | undefined): string {
  return from && from.startsWith('/m') === home.startsWith('/m') ? from : home
}

/** Sign-in page, built on the shadcn login-03 block. */
export function Login() {
  const { user, signIn, lockedUntil } = useAuth()
  const { homeFor } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string>()

  // Once signed in, go back to the page that sent us here if it belongs to this user's area.
  if (user) return <Navigate to={destination(homeFor(user), from)} replace />

  function submit() {
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    const result = signIn(username, password, remember)
    if (!result.ok) {
      setError(result.error)
      setPassword('')
      return
    }
    navigate(destination(homeFor(result.user), from), { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-semibold tracking-tight text-primary-foreground">
            CF
          </div>
          {COMPANY_NAME}
        </div>

        <Card className="shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
          <CardHeader className="text-center">
            <CardTitle><h1 className="text-xl font-medium tracking-[-0.01em]">Welcome back</h1></CardTitle>
            <CardDescription>Sign in with your branch account</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <FieldGroup>
                {error && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Field data-invalid={!!error || undefined}>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-invalid={!!error}
                  />
                </Field>
                <Field data-invalid={!!error || undefined}>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <button
                      type="button"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                      onClick={() => toast('Ask your branch manager to reset your password.')}
                    >
                      Forgot your password?
                    </button>
                  </div>
                  <InputGroup>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!error}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                  <FieldLabel htmlFor="remember" className="font-normal">
                    Keep me signed in on this device
                  </FieldLabel>
                </Field>
                <Field>
                  <Button type="submit" disabled={lockedUntil !== null}>
                    <LogIn data-icon="inline-start" />
                    Sign in
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Sample accounts
                </FieldSeparator>
                <ItemGroup className="gap-2">
                  {users.map((u) => (
                    <Item key={u.id} variant="outline" size="sm">
                      <ItemMedia>
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px]">{u.initials}</AvatarFallback>
                        </Avatar>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {u.username}
                          {u.role === 'collector' && <Badge variant="secondary">Phone</Badge>}
                        </ItemTitle>
                        <ItemDescription>{roleText[u.role]}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUsername(u.username)
                            setPassword(u.password)
                            setError(undefined)
                          }}
                        >
                          Use
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
                <FieldDescription className="text-center">
                  Every sample account uses the password <span className="font-mono">cashflow123</span>.
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
          For authorized Cash Flow Lending staff only. Sign-ins are logged.
        </FieldDescription>
      </div>
    </div>
  )
}
