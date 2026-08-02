# Graph Report - .  (2026-08-02)

## Corpus Check
- 221 files · ~120,197 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1113 nodes · 2203 edges · 136 communities (85 shown, 51 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.77)
- Token cost: 253,076 input · 0 output

## Community Hubs (Navigation)
- Auth Form UI Components
- Fortify Auth Actions & Validation
- App Shell & Layout Components
- Composer Package Config
- Sidebar Navigation Components
- Composer Build Scripts
- Meeting & Kinerja Store Actions
- Daily Meeting Controller
- Auth Feature Tests
- App Header Components
- Kinerja Quality & Time Controllers
- Checkbox & Nav Menu UI
- Perencanaan CSV Import Command
- Filter Bar & Select UI
- Dropdown Menu UI
- Outage Plan Filters & Controllers
- Table UI & Cost Dashboard
- TypeScript Config
- User Model & Email Verification Tests
- 2FA Recovery & Card UI
- shadcn/ui Component Config
- Alert UI & Meeting Show Page
- Outage Progress Calculation Utils
- Kinerja Dashboard Pages
- Lint & Build Dev Dependencies
- App Header & URL Hooks
- Native Build Platform Binaries
- Inertia & Appearance Middleware
- User Model Traits & Verification
- Breadcrumb UI Components
- S-Curve Chart Renderer
- Quality Dashboard Page
- Welcome Page & Mesin/Unit Models
- Chart & UI npm Dependencies
- Mobile Detection & Sidebar Hook
- npm Build Scripts
- Badge UI & Team Outage Page
- CI/CD GitHub Actions Workflows
- Auth Types & Inertia Config
- Authentication Feature Tests
- Password Reset Tests
- Database Seeders
- Profile Update Tests
- Daily Meeting Page & Placeholder UI
- Package.json Metadata
- Auth Background Image Concepts
- PLN Nusantara Power Brand
- WhatsApp Notification Service
- Hero Image & Outage Domain Concepts
- Sidebar Logo Brand Concepts
- ESLint Config Rules
- Favicon & Laravel Brand
- App Icon PLN Concepts
- Icon Component
- Meeting Attendance Form
- QR Display Page
- Concurrently Dependency
- ESLint TS Import Resolver
- ESLint Import Plugin
- ESLint React Plugin
- Globals Package Dependency
- Headless UI Dependency
- Inertia React Dependency
- Inertia Vite Plugin
- Input OTP Dependency
- Laravel Vite Plugin
- Lucide Icons Dependency
- QR Code React Dependency
- Radix Avatar Dependency
- Radix Checkbox Dependency
- Radix Collapsible Dependency
- Radix Dialog Dependency
- Radix Dropdown Dependency
- Radix Label Dependency
- Radix Nav Menu Dependency
- Radix Select Dependency
- Radix Separator Dependency
- Radix Slot Dependency
- Radix Toggle Dependency
- Radix Toggle Group Dependency
- Radix Tooltip Dependency
- React DOM Dependency
- Sonner Toast Dependency
- Tailwind Merge Dependency
- Tailwind CSS Dependency
- Tailwind Vite Plugin
- Tailwind Animate CSS
- React DOM Types
- TypeScript Dependency
- Vite Build Tool
- Vite React Plugin
- Prettier Formatter
- Prettier Tailwind Plugin
- ESLint Stylistic Plugin
- Node Types Dependency
- Apple Touch Icon Laravel Mark
- Robots.txt Crawl Policy

## God Nodes (most connected - your core abstractions)
1. `cn()` - 137 edges
2. `User` - 43 edges
3. `OutagePlan` - 40 edges
4. `DailyMeeting` - 38 edges
5. `Button()` - 27 edges
6. `TestCase` - 27 edges
7. `DailyMeetingController` - 25 edges
8. `Input()` - 18 edges
9. `Label()` - 17 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `pnpm-workspace.yaml (publicHoistPattern: @inertiajs/core)` --shares_data_with--> `ci job (matrix PHP 8.3/8.4/8.5, phpunit)`  [INFERRED]
  pnpm-workspace.yaml → .github/workflows/tests.yml
- `useSidebar()` --references--> `react`  [EXTRACTED]
  resources/js/components/ui/sidebar.tsx → package.json
- `ToggleGroupItem()` --references--> `react`  [EXTRACTED]
  resources/js/components/ui/toggle-group.tsx → package.json
- `pnpm-workspace.yaml (publicHoistPattern: @inertiajs/core)` --shares_data_with--> `quality job (Pint + npm format/lint)`  [INFERRED]
  pnpm-workspace.yaml → .github/workflows/lint.yml
- `planFilterOptions()` --calls--> `OutagePlan`  [INFERRED]
  app/Http/Controllers/Concerns/FiltersOutagePlans.php → app/Models/OutagePlan.php

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared PHP Setup Action Across CI Jobs** — _github_workflows_lint_quality, _github_workflows_tests_ci, gha_shivammathur_setup_php [INFERRED 0.85]

## Communities (136 total, 51 thin omitted)

### Community 0 - "Auth Form UI Components"
Cohesion: 0.08
Nodes (38): DeleteUser(), Heading(), InputError(), PasswordInput(), Props, TextLink(), Props, TwoFactorSetupModal() (+30 more)

### Community 1 - "Fortify Auth Actions & Validation"
Cohesion: 0.06
Nodes (23): CreateNewUser, ResetUserPassword, emailRules(), nameRules(), profileRules(), Controller, ProfileController, SecurityController (+15 more)

### Community 2 - "App Shell & Layout Components"
Cohesion: 0.07
Nodes (34): AppContent(), Props, AppLogoIcon(), AppShell(), Props, AppSidebar(), AppSidebarHeader(), AppearanceToggleTab() (+26 more)

### Community 3 - "Composer Package Config"
Cohesion: 0.04
Nodes (45): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+37 more)

### Community 4 - "Sidebar Navigation Components"
Cohesion: 0.10
Nodes (33): footerNavItems, mainNavItems, NavFooter(), NavUser(), Collapsible(), CollapsibleContent(), CollapsibleTrigger(), SheetDescription() (+25 more)

### Community 5 - "Composer Build Scripts"
Cohesion: 0.06
Nodes (36): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+28 more)

### Community 6 - "Meeting & Kinerja Store Actions"
Cohesion: 0.08
Nodes (9): KinerjaCost, KinerjaQuality, KinerjaTime, MeetingAttendee, MeetingKickoff, MeetingKickoffPhoto, MeetingMinute, OutagePlanProgress (+1 more)

### Community 7 - "Daily Meeting Controller"
Cohesion: 0.12
Nodes (4): DailyMeetingController, DailyMeeting, MeetingFinding, UploadedFile

### Community 8 - "Auth Feature Tests"
Cohesion: 0.11
Nodes (9): Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, PasswordConfirmationTest, RegistrationTest, TwoFactorChallengeTest, DashboardTest, ExampleTest, TestCase (+1 more)

### Community 9 - "App Header Components"
Cohesion: 0.12
Nodes (20): mainNavItems, Props, rightNavItems, AppLogo(), Avatar(), AvatarFallback(), AvatarImage(), Sheet() (+12 more)

### Community 10 - "Kinerja Quality & Time Controllers"
Cohesion: 0.14
Nodes (5): planFilterOptions(), KinerjaQualityController, KinerjaTimeController, OutagePlanController, OutagePlan

### Community 11 - "Checkbox & Nav Menu UI"
Cohesion: 0.16
Nodes (18): Checkbox(), NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger() (+10 more)

### Community 12 - "Perencanaan CSV Import Command"
Cohesion: 0.15
Nodes (5): ImportPerencanaan, UserFactory, Illuminate\Console\Command, Illuminate\Database\Eloquent\Factories\Factory, static

### Community 13 - "Filter Bar & Select UI"
Cohesion: 0.13
Nodes (16): ALL, FilterBar(), FilterOption, FilterSelect(), Select(), SelectContent(), SelectItem(), SelectLabel() (+8 more)

### Community 14 - "Dropdown Menu UI"
Cohesion: 0.13
Nodes (16): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator() (+8 more)

### Community 15 - "Outage Plan Filters & Controllers"
Cohesion: 0.18
Nodes (8): applyPlanFilters(), applyStatusFilter(), planPickerList(), DashboardController, KinerjaCostController, Collection, Illuminate\Database\Eloquent\Builder, Illuminate\Http\Request

### Community 16 - "Table UI & Cost Dashboard"
Cohesion: 0.14
Nodes (16): Table(), TableBody(), TableCaption(), TableCell(), TableFooter(), TableHead(), TableHeader(), TableRow() (+8 more)

### Community 17 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): resources/js/**/*.d.ts, resources/js/**/*.ts, resources/js/**/*.tsx, compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames (+11 more)

### Community 18 - "User Model & Email Verification Tests"
Cohesion: 0.16
Nodes (4): User, Illuminate\Foundation\Auth\User, EmailVerificationTest, SecurityTest

### Community 19 - "2FA Recovery & Card UI"
Cohesion: 0.22
Nodes (12): Props, TwoFactorRecoveryCodes(), Card(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle() (+4 more)

### Community 20 - "shadcn/ui Component Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 21 - "Alert UI & Meeting Show Page"
Cohesion: 0.17
Nodes (13): AlertError(), Alert(), AlertDescription(), AlertTitle(), alertVariants, Attendee, emptyFinding, Finding (+5 more)

### Community 22 - "Outage Progress Calculation Utils"
Cohesion: 0.24
Nodes (14): buildDailyRows(), computeStatus(), DailyProgressRecord, DailyProgressRow, DailyProgressValidationError, formatDMY(), generateDateRange(), getLatestActualProgress() (+6 more)

### Community 23 - "Kinerja Dashboard Pages"
Cohesion: 0.17
Nodes (13): buildFilterQuery(), countActiveFilters(), OnCost(), rupiah(), OnQuality(), daysBetween(), FILTER_KEYS, fmt() (+5 more)

### Community 24 - "Lint & Build Dev Dependencies"
Cohesion: 0.13
Nodes (15): babel-plugin-react-compiler, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, @laravel/vite-plugin-wayfinder, devDependencies, babel-plugin-react-compiler (+7 more)

### Community 25 - "App Header & URL Hooks"
Cohesion: 0.23
Nodes (11): AppHeader(), NavMain(), Separator(), IsCurrentOrParentUrlFn, IsCurrentUrlFn, useCurrentUrl(), UseCurrentUrlReturn, WhenCurrentUrlFn (+3 more)

### Community 26 - "Native Build Platform Binaries"
Cohesion: 0.15
Nodes (13): lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, optionalDependencies, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu (+5 more)

### Community 27 - "Inertia & Appearance Middleware"
Cohesion: 0.21
Nodes (6): HandleAppearance, HandleInertiaRequests, Closure, Illuminate\Foundation\Configuration\Middleware, Inertia\Middleware, Symfony\Component\HttpFoundation\Response

### Community 28 - "User Model Traits & Verification"
Cohesion: 0.18
Nodes (4): Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Notifications\Notifiable, Laravel\Fortify\TwoFactorAuthenticatable, VerificationNotificationTest

### Community 29 - "Breadcrumb UI Components"
Cohesion: 0.29
Nodes (9): Breadcrumbs(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator() (+1 more)

### Community 31 - "Quality Dashboard Page"
Cohesion: 0.22
Nodes (7): FILTER_KEYS, Kinerja, Options, Plan, PlanOption, StatusBadge(), statusOf()

### Community 32 - "Welcome Page & Mesin/Unit Models"
Cohesion: 0.28
Nodes (3): WelcomeController, Mesin, Unit

### Community 33 - "Chart & UI npm Dependencies"
Cohesion: 0.22
Nodes (9): class-variance-authority, clsx, dependencies, class-variance-authority, clsx, recharts, @types/react, recharts (+1 more)

### Community 34 - "Mobile Detection & Sidebar Hook"
Cohesion: 0.31
Nodes (8): react, react, SidebarMenuSkeleton(), SidebarProvider(), getServerSnapshot(), isSmallerThanBreakpoint(), mediaQueryListener(), useIsMobile()

### Community 35 - "npm Build Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:ssr, dev, format, format:check, lint, lint:check (+1 more)

### Community 36 - "Badge UI & Team Outage Page"
Cohesion: 0.28
Nodes (4): Badge(), badgeVariants, teamData, TeamMember

### Community 37 - "CI/CD GitHub Actions Workflows"
Cohesion: 0.36
Nodes (8): quality job (Pint + npm format/lint), Linter Workflow (lint.yml), ci job (matrix PHP 8.3/8.4/8.5, phpunit), Tests Workflow (tests.yml), GitHub Action: actions/checkout@v6, GitHub Action: actions/setup-node@v6, GitHub Action: shivammathur/setup-php@v2, pnpm-workspace.yaml (publicHoistPattern: @inertiajs/core)

### Community 38 - "Auth Types & Inertia Config"
Cohesion: 0.32
Nodes (6): Auth, TwoFactorSecretKey, TwoFactorSetupData, User, InertiaConfig, @inertiajs/core

### Community 41 - "Database Seeders"
Cohesion: 0.38
Nodes (3): DatabaseSeeder, PembangkitSeeder, Illuminate\Database\Seeder

### Community 44 - "Package.json Metadata"
Cohesion: 0.50
Nodes (3): private, $schema, type

### Community 45 - "Auth Background Image Concepts"
Cohesion: 0.67
Nodes (4): Auth Background Image (auth-bg.jpg), Authentication / Login Page Background Design, Power Utility / Grid Outage Management Domain, Wind Farm and Electrical Substation Aerial Scene

### Community 46 - "PLN Nusantara Power Brand"
Cohesion: 0.83
Nodes (4): PLN Bolt-and-Wave Brand Mark (Electricity + Water Symbol), PLN Nusantara Power, PLN Nusantara Power Logo, Unit Pembangkitan Kendari

### Community 48 - "Hero Image & Outage Domain Concepts"
Cohesion: 0.67
Nodes (3): Outage Management Application Domain, Power Plant Facility (Cooling Towers), Hero Image (Power Plant Aerial View)

### Community 49 - "Sidebar Logo Brand Concepts"
Cohesion: 1.00
Nodes (3): PLN Nusantara Power (Organization), Power Generation Iconography (Lightning Bolt + Water Waves), Sidebar Logo (PLN Nusantara Power)

### Community 68 - "Favicon & Laravel Brand"
Cohesion: 1.00
Nodes (3): #FF2D20 Laravel Brand Red, Laravel Icon Mark (faceted diamond/bird logo shape), favicon.svg (App Favicon)

### Community 69 - "App Icon PLN Concepts"
Cohesion: 0.67
Nodes (3): App Icon (PLN Logo), Outage Management Application (this project), PLN (Perusahaan Listrik Negara)

## Knowledge Gaps
- **243 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+238 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Checkbox & Nav Menu UI` to `Auth Form UI Components`, `App Shell & Layout Components`, `Mobile Detection & Sidebar Hook`, `Sidebar Navigation Components`, `Badge UI & Team Outage Page`, `App Header Components`, `Filter Bar & Select UI`, `Dropdown Menu UI`, `Table UI & Cost Dashboard`, `2FA Recovery & Card UI`, `Alert UI & Meeting Show Page`, `App Header & URL Hooks`, `Breadcrumb UI Components`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Chart & UI npm Dependencies` to `Mobile Detection & Sidebar Hook`, `Package.json Metadata`, `Concurrently Dependency`, `Globals Package Dependency`, `Headless UI Dependency`, `Inertia React Dependency`, `Inertia Vite Plugin`, `Input OTP Dependency`, `Laravel Vite Plugin`, `Lucide Icons Dependency`, `QR Code React Dependency`, `Radix Avatar Dependency`, `Radix Checkbox Dependency`, `Radix Collapsible Dependency`, `Radix Dialog Dependency`, `Radix Dropdown Dependency`, `Radix Label Dependency`, `Radix Nav Menu Dependency`, `Radix Select Dependency`, `Radix Separator Dependency`, `Radix Slot Dependency`, `Radix Toggle Dependency`, `Radix Toggle Group Dependency`, `Radix Tooltip Dependency`, `React DOM Dependency`, `Sonner Toast Dependency`, `Tailwind Merge Dependency`, `Tailwind CSS Dependency`, `Tailwind Vite Plugin`, `Tailwind Animate CSS`, `React DOM Types`, `TypeScript Dependency`, `Vite Build Tool`, `Vite React Plugin`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `react` connect `Mobile Detection & Sidebar Hook` to `Chart & UI npm Dependencies`, `Checkbox & Nav Menu UI`, `Sidebar Navigation Components`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 33 inferred relationships involving `User` (e.g. with `.index()` and `.run()`) actually correct?**
  _`User` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `OutagePlan` (e.g. with `.handle()` and `planFilterOptions()`) actually correct?**
  _`OutagePlan` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _243 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Form UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.076103500761035 - nodes in this community are weakly interconnected._