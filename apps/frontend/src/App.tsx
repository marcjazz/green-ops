import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  Bell,
  LayoutDashboard,
  LogOut,
  Server,
  Settings,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { apiClient } from './api/apiClient.js'

const SERVICES = [
  { name: 'nginx', job: 'nginx', description: 'Reverse proxy' },
  { name: 'postgres', job: null, description: 'Database' },
  { name: 'keycloak', job: 'keycloak', description: 'Identity provider' },
  { name: 'alerts-service', job: 'alerts-service', description: 'Alerts API' },
  { name: 'user-service', job: 'user-service', description: 'User API' },
  { name: 'prometheus', job: 'prometheus', description: 'Metrics collection' },
  { name: 'grafana', job: null, description: 'Monitoring dashboards' },
  { name: 'postgres-exporter', job: 'postgres-exporter', description: 'DB metrics exporter' },
]

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Dashboard({ alerts, profile }: { alerts: any[]; profile: any }) {
  const [scrapeDurations, setScrapeDurations] = useState<any[]>([])

  useEffect(() => {
    apiClient.get('/prometheus/api/v1/query?query=scrape_duration_seconds')
      .then((res) => {
        if (res.data.status === 'success') setScrapeDurations(res.data.data.result)
      })
      .catch(() => {})
  }, [])

  return (
    <div className='p-6 space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Alerts
            </CardTitle>
            <Bell className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Theme Preference
            </CardTitle>
            <Settings className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold capitalize'>
              {profile?.theme || 'Default'}
            </div>
          </CardContent>
        </Card>
      </div>

      {scrapeDurations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prometheus Metrics — Scrape Duration</CardTitle>
            <CardDescription>
              Current scrape duration in seconds per job
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {scrapeDurations.map((r: any) => {
                const job = r.metric.job || 'unknown'
                const val = Number.parseFloat(r.value[1])
                const max = Math.max(...scrapeDurations.map((s: any) => Number.parseFloat(s.value[1])), 0.1)
                const pct = Math.min((val / max) * 100, 100)
                return (
                  <div key={job} className='flex items-center gap-3'>
                    <span className='w-36 text-sm font-medium truncate'>{job}</span>
                    <div className='flex-1 h-5 rounded-full bg-muted overflow-hidden'>
                      <div
                        className='h-full rounded-full bg-primary transition-all'
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className='w-16 text-xs text-right text-muted-foreground tabular-nums'>
                      {val.toFixed(3)}s
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>
            A list of recent energy consumption alerts triggered by the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-center py-4 text-muted-foreground'
                  >
                    No alerts found.
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert: any) => (
                  <TableRow key={alert.id} className='cursor-pointer'>
                    <TableCell className='font-medium'>
                      {alert.title}
                    </TableCell>
                    <TableCell>{alert.metricName}</TableCell>
                    <TableCell>{alert.metricValue}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          alert.severity === 'critical'
                            ? 'destructive'
                            : alert.severity === 'warning'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {alert.isRead ? (
                        <Badge variant='outline'>Read</Badge>
                      ) : (
                        <Badge>New</Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {formatDateTime(alert.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Services() {
  const [upStatus, setUpStatus] = useState<Record<string, string>>({})

  useEffect(() => {
    apiClient.get('/prometheus/api/v1/query?query=up')
      .then((res) => {
        if (res.data.status === 'success') {
          const map: Record<string, string> = {}
          for (const r of res.data.data.result) {
            map[r.metric.job] = r.value[1]
          }
          setUpStatus(map)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className='p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Live status of all services managed by this platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {SERVICES.map((svc) => {
              const jobVal = svc.job ? upStatus[svc.job] : undefined
              let status: 'up' | 'down' | 'unknown' = 'unknown'
              let color = 'bg-muted-foreground/40'
              if (jobVal !== undefined) {
                status = jobVal === '1' ? 'up' : 'down'
                color = status === 'up' ? 'bg-primary' : 'bg-destructive'
              }
              return (
                <div
                  key={svc.name}
                  className='flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors'
                >
                  <span className={`inline-block h-3 w-3 rounded-full shrink-0 ${color}`} />
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm font-medium truncate'>{svc.name}</div>
                    <div className='text-xs text-muted-foreground truncate'>{svc.description}</div>
                  </div>
                  <Badge
                    variant={
                      status === 'up' ? 'default'
                      : status === 'down' ? 'destructive'
                      : 'outline'
                    }
                    className='shrink-0'
                  >
                    {status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardLayout() {
  const auth = useAuth()
  const [alerts, setAlerts] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [page, setPage] = useState<'dashboard' | 'services'>('dashboard')

  useEffect(() => {
    if (auth.isAuthenticated) {
      apiClient.get('/alerts').then((res) => setAlerts(res.data.data))
      apiClient.get('/user').then((res) => setProfile(res.data.data))
    }
  }, [auth.isAuthenticated])

  return (
    <SidebarProvider>
      <div className='flex h-screen w-full overflow-hidden bg-background'>
        <Sidebar>
          <SidebarHeader className='p-4 flex items-center gap-2'>
            <Activity className='h-6 w-6 text-primary' />
            <span className='font-bold text-lg'>GreenOps</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className='cursor-pointer'
                      isActive={page === 'dashboard'}
                      onClick={() => setPage('dashboard')}
                    >
                      <LayoutDashboard className='mr-2 h-4 w-4' />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className='cursor-pointer'
                      isActive={page === 'services'}
                      onClick={() => setPage('services')}
                    >
                      <Server className='mr-2 h-4 w-4' />
                      <span>Services</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className='cursor-pointer'>
                      <Bell className='mr-2 h-4 w-4' />
                      <span>Alerts</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className='p-4 border-t'>
            <div className='flex items-center gap-2'>
              <Avatar className='h-8 w-8'>
                <AvatarFallback>
                  {auth.user?.profile.preferred_username
                    ?.substring(0, 2)
                    .toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col truncate'>
                <span className='text-sm font-medium'>
                  {auth.user?.profile.preferred_username}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {auth.user?.profile.email}
                </span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className='flex-1 flex flex-col overflow-auto'>
          <header className='h-16 border-b flex items-center justify-between px-6 bg-card shrink-0 sticky top-0 z-10'>
            <div className='flex items-center gap-4'>
              <SidebarTrigger />
              <Separator orientation='vertical' className='h-6' />
              <h1 className='text-lg font-semibold'>
                {page === 'dashboard' ? 'Dashboard Overview' : 'Service Status'}
              </h1>
            </div>
            <div className='flex items-center gap-4'>
              <DropdownMenu>
                <DropdownMenuTrigger className='cursor-pointer'>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full p-0 overflow-hidden cursor-pointer'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback>
                        {auth.user?.profile.preferred_username
                          ?.substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end'>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {auth.user?.profile.preferred_username}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {auth.user?.profile.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='cursor-pointer'>
                    <User className='mr-2 h-4 w-4' />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className='cursor-pointer'>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='cursor-pointer' onClick={() => auth.signoutRedirect()}>
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {page === 'dashboard' ? (
            <Dashboard alerts={alerts} profile={profile} />
          ) : (
            <Services />
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}

function App() {
  const auth = useAuth()

  if (auth.isLoading) {
    return (
      <div className='h-screen flex items-center justify-center bg-background text-foreground'>
        <div className='flex items-center gap-2'>
          <Activity className='h-5 w-5 animate-pulse text-primary' />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (auth.error) {
    return (
      <div className='h-screen flex items-center justify-center bg-background text-foreground'>
        <div className='text-center'>
          <p className='text-destructive font-medium'>Authentication Error</p>
          <p className='text-sm text-muted-foreground mt-1'>{auth.error.message}</p>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className='h-screen flex flex-col items-center justify-center bg-background'>
        <div className='max-w-sm w-full p-8 bg-card shadow-xl rounded-2xl flex flex-col items-center gap-6 border'>
          <Activity className='h-12 w-12 text-primary' />
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-foreground'>Welcome to GreenOps</h1>
            <p className='text-muted-foreground'>
              Please sign in to access your energy dashboard.
            </p>
          </div>
          <Button
            className='w-full cursor-pointer'
            size='lg'
            onClick={() => auth.signinRedirect()}
          >
            Sign in with Keycloak
          </Button>
        </div>
      </div>
    )
  }

  return <DashboardLayout />
}

export default App
