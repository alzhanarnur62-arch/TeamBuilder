export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  Tabs: undefined;
  Project: { projectId: string };
  CreateIdea: undefined;
  Team: { projectId: string };
  Chat: { chatId: string };
  Candidate: { studentId: string };
  News: undefined;
  NewsDetails: { announcementId: number };
  EventRegistration: undefined;
};

export type TabParamList = {
  Projects: undefined;
  MyTeams: undefined;
  Chats: undefined;
  Favorites: undefined;
  Profile: undefined;
};
