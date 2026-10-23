import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Page } from '@/components/layout'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { useSession } from '@/state/session'
import { useSettings } from '@/state/settings'
import { Dashboard } from './Dashboard'

export function Settings() {
  const { showDashboard, setShowDashboard } = useSettings()
  return (
    <Page crumbs={['Utilities', 'Settings']}>
      <PageHeader title="Settings" description="Settings for this workstation. Each computer keeps its own." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Start page</CardTitle>
          <CardDescription>What staff see first after signing in on this computer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="show-dashboard">Show the Dashboard</FieldLabel>
              <FieldDescription>
                When off, the Dashboard is hidden and everyone starts on their main screen: accounting officers on Encode
                Payments, loan officers on Loans, the President on the Daily target report.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="show-dashboard"
              checked={showDashboard}
              onCheckedChange={(on) => {
                setShowDashboard(on)
                toast.success(on ? 'Dashboard turned on' : 'Dashboard turned off')
              }}
            />
          </Field>
        </CardContent>
      </Card>
    </Page>
  )
}

/** The Dashboard, only when the setting is on; otherwise the user's start page. */
export function DashboardRoute() {
  const { showDashboard, homeFor } = useSettings()
  const { user } = useSession()
  return showDashboard ? <Dashboard /> : <Navigate to={homeFor(user)} replace />
}

/** Sends "/" to the signed-in user's start page. */
export function HomeRedirect() {
  const { homeFor } = useSettings()
  const { user } = useSession()
  return <Navigate to={homeFor(user)} replace />
}
