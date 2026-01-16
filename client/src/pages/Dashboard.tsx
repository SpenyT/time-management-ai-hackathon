import SpeechToText from '@/components/SpeechToText';


export default function Dashboard() {

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Study Dashboard
          </h1>
          <p className="text-gray-400">AI-optimized time management for focused learning</p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SpeechToText 
            enableAutoSend={true}
            autoSendDelay={3000}
            onAutoSend={(text) => {
              console.log('Auto-sent:', text);
            }}
            onTranscriptionUpdate={(text) => {
              console.log('Current text:', text);
            }}
          />
        </div>
      </div>
    </div>
  );
};