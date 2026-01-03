import React from 'react';
import { Book, Search, Map as MapIcon, BarChart3, Activity } from 'lucide-react';

export default function ManualPage({ t }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    <Book className="text-slate-800" size={32} />
                    {t('App Manual')}
                </h2>
                <p className="text-slate-500 font-bold mt-1">
                    {t('Comprehensive guide to using the Multi-Modal Sync application.')}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Trip Planner Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                        <Search size={24} />
                    </div>
                    <h3 className="text-2xl font-black mb-4">{t('Trip Planner')}</h3>
                    <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                        {t('The Trip Planner is the core of the application. Explore optimized routes that combine high-speed rail with regional on-demand transit.')}
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">1</span>
                            {t('Select your Origin (Major Hub) and Destination (Regional Stop).')}
                        </li>
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">2</span>
                            {t('View the generated "Integrated Journey" showing rail leg, transfer logic, and the final on-demand leg.')}
                        </li>
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">3</span>
                            {t('Click "Reserve All Segments" to simulate a booking.')}
                        </li>
                    </ul>
                </div>

                {/* Explore Regional Hubs Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                        <MapIcon size={24} />
                    </div>
                    <h3 className="text-2xl font-black mb-4">{t('Explore Regional Hubs')}</h3>
                    <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                        {t('Visually explore the coverage area of specific regional services.')}
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">1</span>
                            {t('Click on different colored markers on the map to see stop names and details.')}
                        </li>
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">2</span>
                            {t('Use the "Set Startup" and "Set Destination" buttons in the popup to quickly route from the map.')}
                        </li>
                    </ul>
                </div>

                {/* City Planner Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                        <BarChart3 size={24} />
                    </div>
                    <h3 className="text-2xl font-black mb-4">{t('City Planner')} (Analytics)</h3>
                    <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                        {t('For planners and officials: Analyze demand patterns to improve infrastructure.')}
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">1</span>
                            {t('View "Demand Heatmaps" to see where usage is concentrated.')}
                        </li>
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">2</span>
                            {t('Check "Infrastructure Insights" in the sidebar for recommendations like "Permanent Bus Candidate".')}
                        </li>
                    </ul>
                </div>

                {/* Live Rail Tracker Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-rose-600">
                        <Activity size={24} />
                    </div>
                    <h3 className="text-2xl font-black mb-4">{t('Live Rail Tracker')}</h3>
                    <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                        {t('Real-time synchronization engine state monitoring.')}
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">1</span>
                            {t('The sidebar widget shows the current status of the mainline rail connection.')}
                        </li>
                        <li className="flex gap-3 text-sm font-bold text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">2</span>
                            {t('If a delay is detected, it will display the delay time and the "Smart Connection Guard" will adjust pickup times.')}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
