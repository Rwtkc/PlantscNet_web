import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'

const HomePage = lazy(() => import('@/pages/Home/HomePage'))
const BrowsePage = lazy(() => import('@/pages/Browse/BrowsePage'))
const SearchPage = lazy(() => import('@/pages/Search/SearchPage'))
const DownloadPage = lazy(() => import('@/pages/Download/DownloadPage'))
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage'))
const HelpPage = lazy(() => import('@/pages/Help/HelpPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate replace to="/home" /> },
      { path: 'home', element: <HomePage /> },
      { path: 'browse', element: <BrowsePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'download', element: <DownloadPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'help', element: <HelpPage /> },
    ],
  },
  { path: '*', element: <Navigate replace to="/home" /> },
])
