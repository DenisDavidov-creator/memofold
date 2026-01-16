import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/login/page";
import DeckListPage from "../pages/deck-list/page";
import { ProtectedRoute } from "./protected-route";
import DeckDetailsPage from "../pages/deck-details/page";
import DeckReviewPage from "../pages/deck-review/page";
import RegisterPage from "../pages/register/page";
import { MainLayout } from "../layouts/main-layout";
import SchedulesPage from "../pages/schedules/page";
import WordSetsPage from "../pages/word-sets/page";
import WordSetDetailsPage from "../pages/word-set-details/page";
import DeckBuilderPage from "../pages/deck-create.tsx/page";
import ProfilePage from "../pages/profile/page";
import PaymentPage from "../pages/payment/page";
import LandingPage from "../pages/landing/page";

export const router = createBrowserRouter([
    {
        path: '/',
        element:<LandingPage/>
    },
    {
        path: '/login',
        element:<LoginPage/>
    },
    {
        path: '/register',
        element:<RegisterPage/>
    },

    {
        element:<ProtectedRoute/>,
        children:[
            {
                element:<MainLayout/>,
                children: [
                    {
                        path: '/decks',
                        element:<DeckListPage/>
                    },
                    {
                        path: '/decks/:id',
                        element:<DeckDetailsPage/>
                    },
                    {
                        path: '/decks/:id/review',
                        element:<DeckReviewPage/>
                    },
                    { 
                        path: '/deck-builder', 
                        element: <DeckBuilderPage /> 
                    },
                    {
                        path: '/schedules',
                        element:<SchedulesPage/>
                    },
                    { 
                        path: '/word-sets', 
                        element: <WordSetsPage /> 
                    },
                    { 
                        path: '/word-sets/:id', 
                        element: <WordSetDetailsPage /> 
                    },
                    { 
                        path: '/profile', 
                        element: <ProfilePage/> 
                    },
                    { 
                        path: '/payment', 
                        element: <PaymentPage/> 
                    },
                    

                ]
            }

        ]
    }
]);