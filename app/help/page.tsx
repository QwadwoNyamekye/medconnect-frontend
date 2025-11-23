'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();

  return (
    <AppLayout isAuthed={false}>
      <AppHeader
        title="User Guide"
        showBack
        onBack={() => router.back()}
      />
      <div className="max-w-4xl mx-auto px-2 py-4 pb-20 sm:pb-4">
        <Card className="mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-4">
              <h1 className="text-sm font-semibold text-gray-900">MedConnect User Guide</h1>
              
              <p className="text-xs text-gray-600 leading-relaxed">
                Welcome to MedConnect! This guide will help you navigate and use all the features of the platform.
              </p>

              <div className="space-y-4 text-xs">
                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Getting Started</h2>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Creating an Account</h3>
                      <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-700 leading-relaxed">
                        <li>Click the "Sign Up" or "Register" button on the homepage</li>
                        <li>Fill in your information (name, email, password, title, specialty, etc.)</li>
                        <li>Add your credentials by clicking the "+" button</li>
                        <li>Click "Register" to create your account</li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Logging In</h3>
                      <p className="text-gray-700 leading-relaxed">Click "Log In" on the homepage, enter your email and password, then click "Log In" to access your account.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Posting Cases</h2>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Creating a New Case</h3>
                      <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-700 leading-relaxed">
                        <li>Click the "➕ Post Case" button in the navigation</li>
                        <li>Fill in the case title, specialty, and urgency level</li>
                        <li>Add relevant tags</li>
                        <li>Write your case description using the SBAR format:
                          <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                            <li><strong>Situation:</strong> What is happening right now</li>
                            <li><strong>Background:</strong> Relevant clinical history, vital signs, test results</li>
                            <li><strong>Assessment:</strong> Your clinical judgment</li>
                            <li><strong>Recommendation/Request:</strong> What action you recommend and what guidance you need</li>
                          </ul>
                        </li>
                        <li>Click "View Example" to see a sample SBAR format case</li>
                        <li>Click "Post Case" to publish</li>
                      </ol>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Answering Cases</h2>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Providing an Answer</h3>
                      <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-700 leading-relaxed">
                        <li>Browse cases in the feed or use filters to find cases in your specialty</li>
                        <li>Click on a case to view details</li>
                        <li>Scroll to the "Answers" section</li>
                        <li>Write your detailed response with clinical reasoning</li>
                        <li>Optionally attach an image by clicking the attachment icon</li>
                        <li>Click "Post Answer" to submit</li>
                      </ol>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Voting and Engagement</h2>
                  <div className="space-y-2">
                    <p className="text-gray-700 leading-relaxed">
                      Click the 👍 (thumbs up) button on cases or answers to upvote them. Your votes help recognize helpful contributions and contribute to authors' impact scores.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Your <strong>Impact Score</strong> is calculated based on votes received on your cases and answers. Higher scores indicate greater community contribution.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Profile Management</h2>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Editing Your Profile</h3>
                      <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-700 leading-relaxed">
                        <li>Click your name or "Account" in the navigation</li>
                        <li>Click "Edit Profile"</li>
                        <li>Update any information (name, email, specialty, credentials, bio, etc.)</li>
                        <li>Click the camera icon to change your profile picture</li>
                        <li>Toggle privacy settings for phone and email visibility</li>
                        <li>Click "Save Changes" to update</li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Changing Password</h3>
                      <p className="text-gray-700 leading-relaxed">In edit mode, enter your current password, new password, and confirm it, then click "Update Password".</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Messaging</h2>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Starting a Conversation</h3>
                      <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-700 leading-relaxed">
                        <li>Click the 💬 Messages icon in the navigation</li>
                        <li>Click the ➕ (plus) button to start a new conversation</li>
                        <li>Type a name or email to search for users</li>
                        <li>Select participants (add multiple for group chats)</li>
                        <li>Type your message and click "Send"</li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Sending Messages</h3>
                      <p className="text-gray-700 leading-relaxed">Type in the message input at the bottom of a conversation and press Enter or click "Send". You can attach images by clicking the attachment icon.</p>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Unread Messages:</strong> The Messages icon shows a badge with the count of unread messages. Clicking a conversation marks it as read.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Hospital Directory</h2>
                  <div className="space-y-2">
                    <p className="text-gray-700 leading-relaxed">
                      Click "🏥 Hospitals" in the navigation to browse hospitals. You can search by name or filter by level (Primary, Secondary, Tertiary), city, region, or country.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Click "View Details" on any hospital card to see complete information including services, clinic schedules, contact details, and location.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Doctors Directory</h2>
                  <div className="space-y-2">
                    <p className="text-gray-700 leading-relaxed">
                      Click "👥 Doctors" in the navigation to browse registered doctors. Search by name, specialty, or hospital, and filter by specialty, hospital, or country.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Click on a doctor card to view their full profile, including bio, credentials, and contributions.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Tips and Best Practices</h2>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-[10px] text-gray-600 leading-relaxed mb-1.5">
                        <strong className="text-gray-800">Posting Effective Cases:</strong>
                      </p>
                      <p className="text-[10px] text-gray-600 leading-relaxed mb-1"><strong>Do:</strong></p>
                      <ul className="text-[10px] text-gray-600 space-y-0.5 list-disc list-inside ml-2">
                        <li>Use clear, descriptive titles</li>
                        <li>Follow SBAR format for case descriptions</li>
                        <li>Include relevant clinical data</li>
                        <li>Specify what help you need</li>
                        <li>Use appropriate urgency levels</li>
                      </ul>
                      <p className="text-[10px] text-gray-600 leading-relaxed mt-1 mb-1"><strong>Don't:</strong></p>
                      <ul className="text-[10px] text-gray-600 space-y-0.5 list-disc list-inside ml-2">
                        <li>Include patient identifying information</li>
                        <li>Post vague or incomplete cases</li>
                        <li>Use inappropriate language</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-[10px] text-gray-600 leading-relaxed mb-1.5">
                        <strong className="text-gray-800">Writing Helpful Answers:</strong>
                      </p>
                      <p className="text-[10px] text-gray-600 leading-relaxed mb-1"><strong>Do:</strong></p>
                      <ul className="text-[10px] text-gray-600 space-y-0.5 list-disc list-inside ml-2">
                        <li>Provide evidence-based recommendations</li>
                        <li>Include clinical reasoning</li>
                        <li>Be respectful and professional</li>
                        <li>Reference guidelines when relevant</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-semibold text-gray-900 mb-2">Troubleshooting</h2>
                  <div className="space-y-1 text-gray-700 leading-relaxed">
                    <p><strong>Can't Log In:</strong> Verify your email and password are correct. Contact your administrator if issues persist.</p>
                    <p><strong>Can't Post a Case:</strong> Ensure all required fields are filled and you're logged in.</p>
                    <p><strong>Messages Not Loading:</strong> Click the refresh button or check your internet connection.</p>
                    <p><strong>Profile Picture Not Uploading:</strong> Ensure the image is JPG or PNG format and under 5MB.</p>
                  </div>
                </section>

                <section className="pt-3 border-t border-gray-200">
                  <h2 className="font-semibold text-gray-900 mb-2">Need More Help?</h2>
                  <p className="text-gray-700 leading-relaxed">
                    For additional assistance, contact your system administrator or check the full user guide documentation.
                  </p>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
