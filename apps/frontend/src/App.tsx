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
  Settings,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { apiClient } from './api/apiClient.js'

function Dashboard() {
  const auth = useAuth()
  const [alerts, setAlerts] = useState([])
  const [profile, setProfile] = useState<any>(null)

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
                    <SidebarMenuButton>
                      <LayoutDashboard className='mr-2 h-4 w-4' />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
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
          <header className='h-16 border-b flex items-center justify-between px-6 bg-white shrink-0 sticky top-0 z-10'>
            <div className='flex items-center gap-4'>
              <SidebarTrigger />
              <Separator orientation='vertical' className='h-6' />
              <h1 className='text-lg font-semibold'>Dashboard Overview</h1>
            </div>
            <div className='flex items-center gap-4'>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full p-0 overflow-hidden'
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
                  <DropdownMenuItem>
                    <User className='mr-2 h-4 w-4' />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => auth.signoutRedirect()}>
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

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

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  A list of recent energy consumption alerts triggered by the
                  system.
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='text-center py-4 text-muted-foreground'
                        >
                          No alerts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      alerts.map((alert: any) => (
                        <TableRow key={alert.id}>
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

function App() {
  const auth = useAuth()

  if (auth.isLoading)
    return (
      <div className='h-screen flex items-center justify-center'>
        Loading...
      </div>
    )
  if (auth.error) return <div>Oops... {auth.error.message}</div>

  if (!auth.isAuthenticated) {
    return (
      <div className='h-screen flex flex-col items-center justify-center bg-gray-50'>
        <div className='max-w-sm w-full p-8 bg-white shadow-xl rounded-2xl flex flex-col items-center gap-6'>
          <Activity className='h-12 w-12 text-primary' />
          <div className='text-center'>
            <h1 className='text-2xl font-bold'>Welcome to GreenOps</h1>
            <p className='text-muted-foreground'>
              Please sign in to access your energy dashboard.
            </p>
          </div>
          <Button
            className='w-full'
            size='lg'
            onClick={() => auth.signinRedirect()}
          >
            Sign in with Keycloak
          </Button>
        </div>
      </div>
    )
  }

  return <Dashboard />
}

export default App
