import type React from "react";
import type { ReactNode } from "react";
import { AuthProvider } from "react-oidc-context";
import { userManager } from "./userManager.js";

interface AuthProviderWrapperProps {
	children: ReactNode;
}

export const AuthProviderWrapper: React.FC<AuthProviderWrapperProps> = ({
	children,
}) => {
	return (
		<AuthProvider
			userManager={userManager}
			onSigninCallback={() => {
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname,
				);
			}}
		>
			{children}
		</AuthProvider>
	);
};
