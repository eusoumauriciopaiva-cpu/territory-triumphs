import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useConquests } from '@/hooks/useConquests';
import { useGroups } from '@/hooks/useGroups';
import { BottomNav } from '@/components/BottomNav';
import { FeedScreen } from '@/components/FeedScreen';
import { MapScreen } from '@/components/MapScreen';
import { GroupsScreen } from '@/components/GroupsScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { RecordOverlay } from '@/components/RecordOverlay';
import { AuthScreen } from '@/components/AuthScreen';
import type { Conquest } from '@/types';

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { conquests, myConquests, addConquest } = useConquests();
  const { groups, myMemberships, createGroup, joinGroup, leaveGroup } = useGroups();

  const [activeTab, setActiveTab] = useState('feed');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedConquest, setSelectedConquest] = useState<Conquest | null>(null);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleFinishConquest = async (data: { path: [number, number][]; area: number; distance: number }) => {
    try {
      await addConquest.mutateAsync(data);
    } catch (error) {
      console.error('Failed to save conquest:', error);
    }
  };

  const handleShowOnMap = (conquest: Conquest) => {
    setSelectedConquest(conquest);
    setActiveTab('map');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="h-full w-full"
          >
            {activeTab === 'feed' && <FeedScreen conquests={conquests} />}
            {activeTab === 'map' && (
              <MapScreen 
                conquests={conquests}
                selectedConquest={selectedConquest}
                onSelectConquest={setSelectedConquest}
              />
            )}
            {activeTab === 'groups' && (
              <GroupsScreen 
                groups={groups}
                myMemberships={myMemberships}
                onCreateGroup={(name) => createGroup.mutate(name)}
                onJoinGroup={(id) => joinGroup.mutate(id)}
                onLeaveGroup={(id) => leaveGroup.mutate(id)}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen 
                profile={profile}
                history={myConquests}
                onUpdateProfile={(updates) => updateProfile.mutate(updates)}
                onShowOnMap={handleShowOnMap}
                onSignOut={signOut}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'map') setSelectedConquest(null);
        }}
        onRecordClick={() => setIsRecordOpen(true)}
      />

      <AnimatePresence>
        {isRecordOpen && (
          <RecordOverlay
            isOpen={isRecordOpen}
            onClose={() => setIsRecordOpen(false)}
            onFinish={handleFinishConquest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
