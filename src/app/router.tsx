import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { appBasePath } from '@/app/base'
import { AppLayout } from '@/layouts/AppLayout'

const HomePage = lazy(() => import('@/pages/Home/HomePage'))
const BrowsePage = lazy(() => import('@/pages/Browse/BrowsePage'))
const SearchPage = lazy(() => import('@/pages/Search/SearchPage'))
const ToolsPage = lazy(() => import('@/pages/Tools/ToolsPage'))
const DownloadPage = lazy(() => import('@/pages/Download/DownloadPage'))
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage'))
const HelpPage = lazy(() => import('@/pages/Help/HelpPage'))
const ArticleFigurePage = lazy(() => import('@/pages/ArticleFigure/ArticleFigurePage'))

export function createAppRouter() {
  return createBrowserRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate replace to="/home" /> },
          { path: 'home', element: <HomePage /> },
          { path: 'browse', element: <BrowsePage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'tools', element: <ToolsPage /> },
          { path: 'download', element: <DownloadPage /> },
          { path: 'contact', element: <ContactPage /> },
          { path: 'help', element: <HelpPage /> },
          { path: 'article-figure', element: <ArticleFigurePage /> },
        ],
      },
      { path: '*', element: <Navigate replace to="/home" /> },
    ],
    {
      basename: appBasePath || '/',
    },
  )
}
