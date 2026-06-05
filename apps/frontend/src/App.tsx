import { Activity } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/layouts/DashboardLayout.js";

function App() {
	const auth = useAuth();

	if (auth.isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-background text-foreground">
				<div className="flex items-center gap-2">
					<Activity className="h-5 w-5 animate-spin text-primary" />
					<span className="text-sm font-medium">Loading...</span>
				</div>
			</div>
		);
	}

	if (auth.error) {
		return (
			<div className="flex h-screen items-center justify-center bg-background text-foreground">
				<div className="text-center">
					<p className="font-medium text-destructive">Authentication Error</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{auth.error.message}
					</p>
				</div>
			</div>
		);
	}

	if (!auth.isAuthenticated) {
		return (
			<div className="flex h-screen flex-col items-center justify-center bg-background">
				<div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-card p-8 shadow-lg ring-1 ring-foreground/5">
					<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-sm">
						<Activity className="h-7 w-7 text-primary-foreground" />
					</div>
					<div className="text-center">
						<h1 className="text-2xl font-bold tracking-tight text-foreground">
							Welcome to GreenOps
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Sign in to access your energy monitoring dashboard
						</p>
					</div>
					<Button
						className="w-full cursor-pointer"
						size="lg"
						onClick={() => auth.signinRedirect()}
					>
						Sign in with Keycloak
					</Button>
				</div>
			</div>
		);
	}

	return <DashboardLayout />;
}

export default App;
