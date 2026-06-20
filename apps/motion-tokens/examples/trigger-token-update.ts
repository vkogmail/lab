async function updateTokens(tokens: {
  core: any;
  teacher: any;
  pupil: any;
  metadata: any;
}) {
  const response = await fetch(
    'https://api.github.com/repos/vkogmail/Nexus/dispatches',
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer YOUR_GITHUB_PAT`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'update_tokens',
        client_payload: {
          core: JSON.stringify(tokens.core),
          teacher: JSON.stringify(tokens.teacher),
          pupil: JSON.stringify(tokens.pupil),
          metadata: JSON.stringify(tokens.metadata)
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to trigger token update: ${response.statusText}`);
  }
} 