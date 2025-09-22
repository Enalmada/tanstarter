import type React from "react";

type SimpleLinkProps = {
	to: string | { toString: () => string };
	children: React.ReactNode;
	className?: string;
	// biome-ignore lint/suspicious/noExplicitAny: flexible props interface for mock component
	[key: string]: any;
};

// Create a mock router context
const mockRouterContext = {
	loaderData: { user: null },
};

export function Link({ children, className, to, ...props }: SimpleLinkProps) {
	return (
		<a
			href={typeof to === "string" ? to : to.toString()}
			className={className}
			{...props}
		>
			{children}
		</a>
	);
}

export function useRouter() {
	return {
		navigate: () => Promise.resolve(),
		state: { location: { pathname: "/" } },
		store: {
			__store: {},
			currentLocation: {
				pathname: "/",
			},
		},
	};
}

// Mock other exports that might be needed
export const RouterProvider = ({ children }: { children: React.ReactNode }) => (
	<>{children}</>
);

export const Outlet = ({ children }: { children?: React.ReactNode }) => (
	<>{children}</>
);

type MockRouteProps = {
	children?: React.ReactNode;
};

type MockRoute = {
	path: string;
	component: React.ComponentType<MockRouteProps>;
	loader: () => Promise<unknown>;
	useLoaderData: () => unknown;
	addChildren?: (children: MockRoute[]) => MockRoute;
};

type RouterOptions = {
	routeTree: MockRoute;
	history: { initialEntries: string[] };
};

export const createRootRoute = (): MockRoute => {
	const route: MockRoute = {
		path: "/",
		component: Outlet,
		loader: async () => mockRouterContext.loaderData,
		useLoaderData: () => mockRouterContext.loaderData,
	};
	route.addChildren = (_children) => {
		// In a real implementation, this would add routes to the tree
		return route;
	};
	return route;
};

export const createRoute = (): MockRoute => ({
	path: "/",
	component: Outlet,
	loader: async () => mockRouterContext.loaderData,
	useLoaderData: () => mockRouterContext.loaderData,
});

export const createRouter = ({ routeTree, history }: RouterOptions) => ({
	routeTree,
	history,
});

export const createMemoryHistory = ({ initialEntries = ["/"] } = {}) => ({
	initialEntries,
});

export const createFileRoute = (path: string) => () => ({
	path,
	component: ({ children }: MockRouteProps) => <>{children}</>,
	loader: async () => mockRouterContext.loaderData,
	useLoaderData: () => mockRouterContext.loaderData,
});

export const Link$ = Link;
export const useNavigate = () => () => {};
export const useParams = () => ({});
export const useSearch = () => ({});
export const useRouterState = () => ({ location: { pathname: "/" } });
export const useMatches = () => [];
export const useMatch = () => ({
	pathname: "/",
	params: {},
	search: {},
	routeId: "root",
});
export const useLocation = () => ({
	pathname: "/",
	search: {},
	hash: "",
	state: {},
});
export const useLoaderData = () => mockRouterContext.loaderData;

// Error handling components and hooks
export const ErrorComponent = ({ error }: { error?: Error }) => (
	<div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
		<h3>Error in Storybook</h3>
		<p>{error?.message || "An error occurred"}</p>
	</div>
);

export const DefaultErrorComponent = ErrorComponent;
export const CatchBoundary = ErrorComponent;

// Head content component for managing document head
export const HeadContent = ({ children }: { children?: React.ReactNode }) => (
	<>{children}</>
);

// Scripts component for managing scripts in document
export const Scripts = ({ children }: { children?: React.ReactNode }) => (
	<>{children}</>
);

// TanStack Start specific components
export const ScriptOnce = ({ children }: { children?: React.ReactNode }) => (
	<>{children}</>
);

export const Await = ({
	promise: _promise,
	children: _children,
	fallback,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: generic Promise mock for testing
	promise: Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: generic data handler for testing
	children: (data: any) => React.ReactNode;
	fallback?: React.ReactNode;
}) => <>{fallback || "Loading..."}</>;

export const Meta = ({ children }: { children?: React.ReactNode }) => (
	<>{children}</>
);

// Additional router exports that might be needed
export const createRootRouteWithContext = () => {
	// biome-ignore lint/suspicious/noExplicitAny: flexible router options for testing
	return (options: any) => ({
		...createRootRoute(),
		...options,
		// Mock the loader data function
		useLoaderData: () => ({
			...mockRouterContext.loaderData,
			user: null,
			isAuthenticated: false,
		}),
	});
};
export const createServerFileRoute = (path: string) => createFileRoute(path);
export const redirect = (path: string) => ({ redirect: path });
export const notFound = () => ({ notFound: true });

// Route identifiers and constants
export const rootRouteId = "__root__";
export const rootRouteWithoutContext = createRootRoute();

// Export a mock Route object with a proper useLoaderData function
export const Route = {
	useLoaderData: () => {
		const defaults = {
			user: null,
			isAuthenticated: false,
		};
		const result = {
			...defaults,
			...mockRouterContext.loaderData,
		};
		return result;
	},
};

// Export a function to update the mock loader data
export const setMockLoaderData = (data: unknown) => {
	// @ts-expect-error
	mockRouterContext.loaderData = data;
};

// Route is already exported above

// Lazy route component for code splitting - mock implementation
export const lazyRouteComponent = <T extends React.ComponentType>(
	_importFn: () => Promise<{ default: T }>,
	_exportName = "default",
) => {
	// In Storybook, we can just return a simple component since code splitting isn't needed
	return ({ children }: { children?: React.ReactNode }) => <>{children}</>;
};
