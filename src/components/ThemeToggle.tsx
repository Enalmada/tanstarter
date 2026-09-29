import { useLingui } from "@lingui/react/macro";
import { MoonIcon, SunIcon } from "lucide-react";
import { type Theme, useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function ThemeToggle() {
	const { t } = useLingui();
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="icon" type="button" />}>
				<SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				<MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				<span className="sr-only">{t`Toggle theme`}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
					<DropdownMenuRadioItem value="light">{t`Light`}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">{t`Dark`}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">{t`System`}</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
