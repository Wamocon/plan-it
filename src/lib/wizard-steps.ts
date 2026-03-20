import { WizardStep } from '@/types';
export const wizardSteps: WizardStep[] = [
  { id:'basics',title:'Grundlagen',icon:'🏢',fields:[
    {key:'projectName',label:'Projektname',type:'text',placeholder:'z.B. Architektur 2026'},
    {key:'clientName',label:'Kunde / Firma',type:'text',placeholder:'z.B. Intern oder Kundenname'},
    {key:'teamSize',label:'Teamgröße',type:'select',allowCustom:true,customKey:'teamSizeC',options:[['1-5','1–5'],['5-15','5–15'],['15-30','15–30'],['30+','30+'],['_c','Andere...']]},
    {key:'appCount',label:'Aktuelle Apps',type:'select',allowCustom:true,customKey:'appCountC',options:[['0','Keine'],['1-5','1–5'],['5-10','5–10'],['10-20','10–20'],['20+','20+'],['_c','Andere...']]},
    {key:'targetApps',label:'Geplante Apps (Ziel)',type:'select',allowCustom:true,customKey:'targetAppsC',options:[['10','~10'],['20','~20'],['50','50+'],['100','100+'],['_c','Andere...']]}
  ]},
  { id:'stack',title:'Tech Stack',icon:'⚙️',fields:[
    {key:'primaryStack',label:'Tech Stack (Mehrfachauswahl)',type:'multi',options:[['nextjs','Next.js / React'],['vue','Vue / Nuxt'],['angular','Angular'],['laravel','Laravel / PHP'],['rails','Ruby on Rails'],['dotnet','.NET'],['python','Python / Django'],['java','Java / Spring'],['go','Go']]},
    {key:'database',label:'Datenbank (Mehrfachauswahl)',type:'multi',options:[['postgres','PostgreSQL'],['mysql','MySQL'],['mariadb','MariaDB'],['mongodb','MongoDB'],['supabase','Supabase'],['firebase','Firebase'],['sqlite','SQLite'],['redis','Redis']]},
    {key:'hosting',label:'Hosting (Mehrfachauswahl)',type:'multi',options:[['vercel','Vercel'],['aws','AWS'],['azure','Azure'],['gcp','Google Cloud'],['selfhosted','Eigener Server'],['strato','Strato'],['hetzner','Hetzner'],['docker','Docker (self-hosted)']]},
    {key:'legacyApps',label:'Legacy-Systeme?',type:'select',options:[['no','Nein'],['yes','Ja']]},
    {key:'legacyDetail',label:'Welche Legacy-Technologien?',type:'text',placeholder:'z.B. PHP 8.2, Laravel 8, MariaDB 10.1',showWhen:(d)=>d.legacyApps==='yes'}
  ]},
  { id:'processes',title:'Prozesse',icon:'🔄',fields:[
    {key:'codeSharing',label:'Code-Sharing (Mehrfachauswahl)',type:'multi',options:[['none','Kein Sharing'],['copypaste','Copy-Paste'],['git-sub','Git Submodules'],['sharedlib','Shared Library / npm'],['monorepo','Monorepo']]},
    {key:'designSystem',label:'Design System',type:'select',allowCustom:true,customKey:'designSystemC',options:[['none','Keines'],['partial','Teilweise'],['full','Vollständig'],['_c','Anderes...']]},
    {key:'cicd',label:'CI/CD (Mehrfachauswahl)',type:'multi',options:[['none','Keine'],['github-actions','GitHub Actions'],['gitlab-ci','GitLab CI'],['jenkins','Jenkins'],['inconsistent','Unterschiedlich pro App'],['standardized','Standardisiert']]},
    {key:'testing',label:'Testing (Mehrfachauswahl)',type:'multi',options:[['none','Keines'],['unit','Unit Tests'],['integration','Integration Tests'],['e2e','E2E Tests'],['minimal','Nur vereinzelt'],['comprehensive','Umfassend']]}
  ]},
  { id:'infra',title:'Infrastruktur',icon:'🖥️',fields:[
    {key:'monitoring',label:'Monitoring (Mehrfachauswahl)',type:'multi',options:[['none','Keines'],['analytics','Web Analytics'],['uptime','Uptime-Monitoring'],['sentry','Sentry / Error Tracking'],['logging','Zentrales Logging'],['dashboard','Dashboard']]},
    {key:'documentation',label:'Dokumentation (Mehrfachauswahl)',type:'multi',options:[['none','Fehlt'],['outdated','Veraltet'],['readme','READMEs'],['adr','ADRs'],['storybook','Storybook'],['wiki','Wiki / Confluence']]},
    {key:'branching',label:'Branching',type:'select',allowCustom:true,customKey:'branchingC',options:[['none','Keine'],['basic','main/develop'],['gitflow','Git Flow'],['trunk','Trunk-Based'],['_c','Andere...']]},
    {key:'onboardingTime',label:'Onboarding-Dauer',type:'select',allowCustom:true,customKey:'onboardingTimeC',options:[['days','1–3 Tage'],['week','1 Woche'],['weeks','2–4 Wochen'],['month','> 1 Monat'],['_c','Andere...']]}
  ]},
  { id:'security',title:'Sicherheit & API',icon:'🔐',fields:[
    {key:'security',label:'Sicherheitsmaßnahmen (Mehrfachauswahl)',type:'multi',options:[
      ['none','Keine Maßnahmen'],
      ['dependency-scan','Dependency Scanning (Dependabot / Snyk)'],
      ['sast','SAST / Code-Analyse (SonarQube / CodeQL)'],
      ['secrets','Secrets Management (Vault / Doppler)'],
      ['code-review','Code Reviews (PR-Pflicht)'],
      ['pentest','Penetration Testing']
    ]},
    {key:'authStrategy',label:'Authentifizierung / Identity',type:'select',options:[
      ['none','Keine / Nicht relevant'],
      ['selfbuilt','Selbst gebaut (Custom Login)'],
      ['jwt','JWT (selbst implementiert)'],
      ['oauth','OAuth 2.0 / OIDC (Google, GitHub…)'],
      ['saml','SAML / Enterprise SSO'],
      ['managed','Managed: Auth0 / Cognito / Keycloak']
    ]},
    {key:'apiStrategy',label:'API-Strategie (Mehrfachauswahl)',type:'multi',options:[
      ['none','Keine API / Nicht relevant'],
      ['rest','REST'],
      ['graphql','GraphQL'],
      ['grpc','gRPC'],
      ['websocket','WebSocket / Realtime'],
      ['openapi','OpenAPI / Swagger Spec'],
      ['versioning','API Versionierung (v1, v2…)']
    ]},
    {key:'reviewProcess',label:'Code Review Prozess',type:'select',options:[
      ['none','Kein Review-Prozess'],
      ['informal','Informell / nach Bedarf'],
      ['pr-review','Pull Request Reviews (verpflichtend)'],
      ['formal','Formale Reviews + Architecture Board']
    ]}
  ]}
];
