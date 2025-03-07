import { Button } from "@/components/ui/button"
import { useTheme } from "./ThemeProvider"
import { MoonIcon, SunIcon } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-8 h-8 absolute top-2 right-2"
    >
      <span className="sr-only">Toggle theme</span>
      {theme === "light" ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </Button>
  )
} 