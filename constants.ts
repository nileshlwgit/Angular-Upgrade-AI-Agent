
import { AgentType } from './types';
import { ScanSearch, BrainCircuit, Hammer, ShieldCheck, Bot, Layout, Eye, Hourglass, Minimize2, Maximize2, Book } from 'lucide-react';

export const AGENT_CONFIG = {
  [AgentType.IDLE]: {
    name: 'System Idle',
    icon: Bot,
    color: 'text-gray-500',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    description: 'Waiting for user input...'
  },
  [AgentType.SCANNER]: {
    name: 'Code Scanner',
    icon: ScanSearch,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Scanning project structure, dependencies, and customizations.'
  },
  [AgentType.STRATEGIST]: {
    name: 'Upgrade Strategist',
    icon: BrainCircuit,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Analyzing compatibility matrix and defining upgrade path.'
  },
  [AgentType.EXECUTOR]: {
    name: 'Code Executor',
    icon: Hammer,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Running migrations, updating Node.js, and refactoring code.'
  },
  [AgentType.QA]: {
    name: 'QA Verifier',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Validating build integrity and running test suites.'
  }
};

// Initial Mock Files to simulate a real repo fetch
export const INITIAL_MOCK_FILES = [
  {
    path: 'package.json',
    content: `{
  "name": "legacy-angular-app",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "~13.0.0",
    "@angular/common": "~13.0.0",
    "@angular/compiler": "~13.0.0",
    "@angular/core": "~13.0.0",
    "@angular/forms": "~13.0.0",
    "@angular/platform-browser": "~13.0.0",
    "@angular/platform-browser-dynamic": "~13.0.0",
    "@angular/router": "~13.0.0",
    "rxjs": "~7.4.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.11.4"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "~13.0.0",
    "@angular/cli": "~13.0.0",
    "@angular/compiler-cli": "~13.0.0",
    "@types/node": "^12.11.1",
    "typescript": "~4.4.3"
  }
}`
  },
  {
    path: 'src/app/app.module.ts',
    content: `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`
  },
  {
    path: 'src/app/app.component.ts',
    content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<h1>Welcome to Angular 13</h1>',
  styles: []
})
export class AppComponent {
  title = 'legacy-angular-app';
}`
  }
];

export const ICONS = {
    Layout,
    Eye,
    Hourglass,
    Minimize2,
    Maximize2,
    Book
}
