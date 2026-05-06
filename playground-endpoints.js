/**
 * REST playground catalog — mirrors public API routes (sandbox/production).
 * `auth`: none | clerk | apiKeyOrClerk
 */

export const PLAYGROUND_TAG_ORDER = ['Health', 'Auth', 'KYC', 'Admin', 'Config'];

/** @type {Array<{
 *   id: string,
 *   tag: string,
 *   title: string,
 *   description: string,
 *   method: string,
 *   path: string,
 *   auth: 'none'|'clerk'|'apiKeyOrClerk',
 *   body?: string,
 *   pathParams?: Array<{ name: string, example?: string, description?: string }>,
 *   responseExamples: Array<{ status: number, label: string, body?: unknown }>
 * }>} */
export const PLAYGROUND_ENDPOINTS = [
  {
    id: 'health',
    tag: 'Health',
    title: 'Health check',
    description:
      'Liveness probe. Returns service metadata including `appUrl`. No authentication.',
    method: 'GET',
    path: '/health',
    auth: 'none',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          status: 'ok',
          timestamp: '2026-05-06T17:30:00.000Z',
          version: '1.0.0',
          aiProvider: 'Groq (Llama 4 Scout 17Bx16E)',
          appUrl: 'https://armith.onrender.com'
        }
      }
    ]
  },
  {
    id: 'auth-status',
    tag: 'Auth',
    title: 'Authentication status',
    description:
      'Returns whether Clerk sees a logged-in dashboard session when using a Bearer session JWT. Calls from curl/docs without cookies typically show `authenticated: false`.',
    method: 'GET',
    path: '/auth/status',
    auth: 'none',
    responseExamples: [
      {
        status: 200,
        label: 'Authenticated',
        body: { success: true, data: { authenticated: true, userId: 'user_xxxxxxxx' } }
      },
      {
        status: 200,
        label: 'Not authenticated (anonymous / API-only flow)',
        body: { success: true, data: { authenticated: false, userId: null } }
      }
    ]
  },
  {
    id: 'auth-profile',
    tag: 'Auth',
    title: 'Current user profile',
    description:
      'Dashboard user record (plan, usage). Requires Clerk session Bearer token — same JWT the React app sends. API keys are not accepted on this route.',
    method: 'GET',
    path: '/auth/profile',
    auth: 'clerk',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          success: true,
          data: {
            user: {
              clerkId: 'user_xx',
              planTier: 'free',
              verificationUsage: { currentPeriodCount: 3 },
              limitsOverride: null
            }
          }
        }
      },
      { status: 401, label: 'No Clerk session', body: { error: 'Unauthorized — Clerk bearer required' } },
      {
        status: 500,
        label: 'Server error',
        body: { success: false, error: 'Failed to fetch profile' }
      }
    ]
  },
  {
    id: 'kyc-countries',
    tag: 'KYC',
    title: 'Supported countries',
    description: 'Lists country codes validators exist for.',
    method: 'GET',
    path: '/kyc/countries',
    auth: 'none',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          countries: [{ code: 'TR', label: 'Turkiye' }, { code: 'US', label: 'United States' }]
        }
      }
    ]
  },
  {
    id: 'kyc-llm-status',
    tag: 'KYC',
    title: 'LLM status',
    description: 'Backend LLM readiness signal.',
    method: 'GET',
    path: '/kyc/llm-status',
    auth: 'none',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          configured: true,
          provider: 'Groq',
          reasoningModel: 'llama-4-maverick-17b-128e-instruct-fast',
          visionModel: 'moonshotai/kimi-k2-thinking-turbo-preview'
        }
      },
      {
        status: 503,
        label: 'Not configured',
        body: {
          configured: false,
          errorCode: 'GROQ_NOT_CONFIGURED'
        }
      }
    ]
  },
  {
    id: 'kyc-upload-url',
    tag: 'KYC',
    title: 'Generate upload URL',
    description:
      'Creates a presigned PUT URL for R2. Send `x-api-key` OR Clerk Bearer. Use returned `uploadUrl` for browser/raw PUT then call ID/selfie verify with `downloadUrl` values.',
    method: 'POST',
    path: '/kyc/upload-url',
    auth: 'apiKeyOrClerk',
    body: JSON.stringify(
      { fileType: 'image/jpeg', documentType: 'id-front', userId: null },
      null,
      2
    ),
    responseExamples: [
      {
        status: 200,
        label: 'Success',
        body: {
          success: true,
          uploadUrl: 'https://….r2.cloudflarestorage.com/bucket/users/…/id-front.jpeg?…',
          downloadUrl: 'https://….r2.cloudflarestorage.com/bucket/users/…/…',
          expiresIn: 300,
          contentType: 'image/jpeg',
          storageType: 'r2'
        }
      },
      {
        status: 400,
        label: 'Bad document type',
        body: {
          status: 'failed',
          errors: [
            {
              code: 'INVALID_DOCUMENT_TYPE',
              message: 'Document type must be one of: id-front, id-back, selfie'
            }
          ]
        }
      },
      {
        status: 401,
        label: 'Missing / invalid credentials',
        body: { error: 'Authentication required' }
      },
      {
        status: 401,
        label: 'Invalid API key',
        body: { error: 'Invalid API key' }
      },
      {
        status: 500,
        label: 'Storage unavailable',
        body: {
          status: 'failed',
          errors: [{ code: 5004, textCode: 'INTERNAL_ERROR', message: 'An internal server error occurred.' }]
        }
      }
    ]
  },
  {
    id: 'kyc-secure-download-url',
    tag: 'KYC',
    title: 'Secure download URL',
    description: 'Issues a short-lived GET URL for an existing stored object key.',
    method: 'POST',
    path: '/kyc/secure-download-url',
    auth: 'apiKeyOrClerk',
    body: JSON.stringify({ fileName: 'users/user_xxx/id-front.jpeg' }, null, 2),
    responseExamples: [
      {
        status: 200,
        label: 'Success',
        body: {
          success: true,
          downloadUrl: 'https://….r2.cloudflarestorage.com/…',
          expiresIn: 3600
        }
      },
      {
        status: 400,
        label: 'Validation error',
        body: {
          status: 'failed',
          errors: [{ message: 'fileName required' }]
        }
      },
      {
        status: 401,
        label: 'Unauthorized',
        body: { error: 'Authentication required' }
      },
      {
        status: 500,
        label: 'Internal error',
        body: { status: 'failed', errors: [{ textCode: 'INTERNAL_ERROR', message: '…' }] }
      }
    ]
  },
  {
    id: 'kyc-id-check',
    tag: 'KYC',
    title: 'ID verification',
    description:
      'Runs ID extraction / validation against image URLs from upload-url. Consumes quota for authenticated tenants.',
    method: 'POST',
    path: '/kyc/id-check',
    auth: 'apiKeyOrClerk',
    body: JSON.stringify(
      {
        countryCode: 'TR',
        frontImageUrl: 'https://example-bucket/id-front.jpeg',
        backImageUrl: null,
        documentType: 'Government Issued ID'
      },
      null,
      2
    ),
    responseExamples: [
      {
        status: 200,
        label: 'Approved checkpoint',
        body: {
          status: 'approved',
          idStatus: 'approved',
          profileId: '672a9c2e3f1b2c4d5e6f7890',
          message: 'Verification complete!',
          data: { firstName: 'Ada', lastName: 'Lovelace', identityNumber: '••••' },
          rejectionReasons: [],
          errors: []
        }
      },
      {
        status: 200,
        label: 'Needs selfie (pending overall)',
        body: {
          status: 'pending',
          profileId: '672a9c2e3f1b2c4d5e6f7890',
          message: 'ID verification successful. Please complete selfie verification.',
          idStatus: 'approved',
          errors: []
        }
      },
      {
        status: 400,
        label: 'Preflight / validation',
        body: {
          status: 'failed',
          errors: [{ code: 3001, textCode: 'BLURRY_IMAGE', message: 'ID card image is too blurry to read clearly.' }]
        }
      },
      {
        status: 429,
        label: 'Plan limit reached',
        body: {
          status: 'failed',
          errors: [
            {
              code: 'PLAN_LIMIT_REACHED',
              message: 'Monthly verification limit reached for your plan.',
              details: {
                tier: 'free',
                used: 100,
                limit: 100,
                upgradeHint: 'Upgrade your plan to continue verifications.'
              }
            }
          ]
        }
      },
      {
        status: 500,
        label: 'Upstream / internal failure',
        body: { status: 'failed', errors: [{ textCode: 'VERIFICATION_ERROR', message: 'Verification error occurred.' }] }
      },
      { status: 401, label: 'Unauthorized', body: { error: 'Authentication required' } }
    ]
  },
  {
    id: 'kyc-selfie-check',
    tag: 'KYC',
    title: 'Selfie verification',
    description: 'Face match + liveness-style checks against ID photo and selfie URL(s).',
    method: 'POST',
    path: '/kyc/selfie-check',
    auth: 'apiKeyOrClerk',
    body: JSON.stringify(
      {
        idPhotoUrl: 'https://example-bucket/id-front.jpeg',
        selfieUrls: ['https://example-bucket/selfie.jpeg'],
        profileId: '672a9c2e3f1b2c4d5e6f7890'
      },
      null,
      2
    ),
    responseExamples: [
      {
        status: 200,
        label: 'Approved',
        body: {
          status: 'approved',
          profileId: '672a9c2e3f1b2c4d5e6f7890',
          message: 'Verification complete!',
          data: { isMatch: true, matchConfidence: 92, spoofingRisk: 0.04 }
        }
      },
      {
        status: 400,
        label: 'Business rule / bad input',
        body: { status: 'failed', errors: [{ textCode: 'ID_CARD_VERIFICATION_REQUIRED', message: 'ID card must be verified before selfie…' }] }
      },
      {
        status: 400,
        label: 'profileId required',
        body: {
          status: 'failed',
          errors: [
            {
              code: 6010,
              textCode: 'PROFILE_ID_REQUIRED',
              message: 'profileId is required before selfie verification when both ID card and selfie are required.'
            }
          ]
        }
      },
      { status: 403, label: 'Ownership', body: { error: 'You do not have access to this verification profile.' } },
      { status: 401, label: 'Unauthorized', body: { error: 'Authentication required' } },
      {
        status: 500,
        label: 'Internal error',
        body: { status: 'failed', errors: [{ textCode: 'INTERNAL_ERROR', message: 'An internal server error occurred.' }] }
      }
    ]
  },
  {
    id: 'kyc-status',
    tag: 'KYC',
    title: 'Verification status',
    description: 'Composite status for a profile (ID + selfie checkpoints, thresholds, images).',
    method: 'GET',
    path: '/kyc/status/:profileId',
    auth: 'apiKeyOrClerk',
    pathParams: [
      {
        name: 'profileId',
        example: '672a9c2e3f1b2c4d5e6f7890',
        description: 'MongoDB ObjectId from verify-id / verify-selfie response'
      }
    ],
    responseExamples: [
      {
        status: 200,
        label: 'In progress',
        body: {
          id: '672a9c2e3f1b2c4d5e6f7890',
          status: 'PENDING',
          country: 'TR',
          progress: {
            idVerification: { required: true, completed: true, approved: true },
            selfieVerification: { required: true, completed: false, approved: false },
            isFullyVerified: false
          },
          images: { idFront: 'https://…', idBack: null, selfie: null },
          thresholds: {}
        }
      },
      {
        status: 404,
        label: 'Unknown profile',
        body: {
          status: 'failed',
          errors: [{ code: 'NOT_FOUND', message: 'Profile not found' }]
        }
      },
      {
        status: 403,
        label: 'Access denied',
        body: { error: 'You do not have access to this verification profile.' }
      },
      { status: 401, label: 'Unauthorized', body: { error: 'Authentication required' } },
      {
        status: 500,
        label: 'Server error',
        body: { status: 'failed', errors: [{ textCode: 'INTERNAL_ERROR', message: '…' }] }
      }
    ]
  },
  {
    id: 'admin-verifications',
    tag: 'Admin',
    title: 'List verifications',
    description:
      'Paginated list of KYC profiles for the tenant. Optional query: `?page=1&limit=10&status=PENDING`. Clerk Bearer only.',
    method: 'GET',
    path: '/admin/verifications',
    auth: 'clerk',
    responseExamples: [
      {
        status: 200,
        label: 'Page of results',
        body: {
          users: [
            {
              id: '672a9c2e3f1b2c4d5e6f7890',
              fullName: 'Ada Lovelace',
              status: 'APPROVED',
              country: 'TR',
              createdAt: '2026-05-06T12:00:00.000Z'
            }
          ],
          pagination: { currentPage: 1, totalPages: 3, totalUsers: 21, hasNext: true, hasPrev: false }
        }
      },
      {
        status: 401,
        label: 'Unauthorized',
        body: { status: 'failed', errors: [{ textCode: 'UNAUTHORIZED', message: 'Unauthorized' }] }
      }
    ]
  },
  {
    id: 'admin-stats',
    tag: 'Admin',
    title: 'Dashboard statistics',
    description: 'Aggregated counts for the current tenant.',
    method: 'GET',
    path: '/admin/stats',
    auth: 'clerk',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          totalVerifications: 42,
          approvedCount: 30,
          rejectedCount: 5,
          pendingCount: 7,
          approvalRate: 71
        }
      },
      { status: 401, label: 'Unauthorized', body: { status: 'failed', errors: [{ message: 'Unauthorized' }] } }
    ]
  },
  {
    id: 'admin-settings-get',
    tag: 'Admin',
    title: 'Get tenant KYC UI settings',
    description: 'Thresholds bundle used by dashboard flows.',
    method: 'GET',
    path: '/admin/settings',
    auth: 'clerk',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          settings: {
            verificationRules: { requireIdCard: true, requireSelfie: true },
            thresholds: { minConfidence: '0.7' }
          },
          defaults: {}
        }
      },
      {
        status: 500,
        label: 'Error',
        body: { status: 'failed', errors: [{ message: 'An internal server error occurred.' }] }
      }
    ]
  },
  {
    id: 'admin-settings-put',
    tag: 'Admin',
    title: 'Update tenant KYC settings',
    description: 'Send partial patches for `verificationRules` and/or flat `thresholds` keys.',
    method: 'PUT',
    path: '/admin/settings',
    auth: 'clerk',
    body: JSON.stringify(
      {
        verificationRules: { requireIdCard: true, requireSelfie: true },
        thresholds: { minConfidence: '0.75' }
      },
      null,
      2
    ),
    responseExamples: [
      {
        status: 200,
        label: 'Updated',
        body: { success: true, settings: {}, message: 'Settings updated successfully' }
      },
      { status: 404, label: 'Config missing', body: { error: 'Configuration not found' } },
      {
        status: 500,
        label: 'Error',
        body: { status: 'failed', errors: [{ message: 'An internal server error occurred.' }] }
      }
    ]
  },
  {
    id: 'admin-settings-reset',
    tag: 'Admin',
    title: 'Reset settings to defaults',
    method: 'POST',
    path: '/admin/settings/reset',
    auth: 'clerk',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: { success: true, settings: {}, message: 'Settings reset to defaults' }
      }
    ]
  },
  {
    id: 'admin-api-keys-list',
    tag: 'Admin',
    title: 'List API keys',
    method: 'GET',
    path: '/admin/api-keys',
    auth: 'clerk',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          apiKeys: [
            {
              id: '682a….ef01',
              name: 'staging-backend',
              prefix: 'ak_live_x',
              createdAt: '2026-05-01T00:00:00.000Z',
              lastUsedAt: null,
              revokedAt: null
            }
          ]
        }
      },
      {
        status: 500,
        label: 'Error',
        body: { error: 'Failed to fetch API keys' }
      }
    ]
  },
  {
    id: 'admin-api-keys-create',
    tag: 'Admin',
    title: 'Create API key',
    description: '`token` is shown only once; store securely.',
    method: 'POST',
    path: '/admin/api-keys',
    auth: 'clerk',
    body: JSON.stringify({ name: 'my-integration' }, null, 2),
    responseExamples: [
      {
        status: 201,
        label: 'Created',
        body: {
          apiKey: {
            id: '682a….ef01',
            name: 'my-integration',
            prefix: 'ak_live_a',
            createdAt: '2026-05-06T18:00:00.000Z',
            revokedAt: null
          },
          token: 'ak_live_………………'
        }
      },
      { status: 400, label: 'Missing name', body: { error: 'API key name is required' } },
      {
        status: 500,
        label: 'Error',
        body: { error: 'Failed to create API key' }
      }
    ]
  },
  {
    id: 'admin-api-keys-delete',
    tag: 'Admin',
    title: 'Revoke API key',
    method: 'DELETE',
    path: '/admin/api-keys/:id',
    auth: 'clerk',
    pathParams: [{ name: 'id', example: '682aab12ef34cd56ab7890ab', description: 'API key Mongo id' }],
    responseExamples: [
      {
        status: 200,
        label: 'Revoked',
        body: {
          apiKey: {
            id: '682aab12ef34cd56ab7890ab',
            name: 'my-integration',
            prefix: 'ak_live_a',
            revokedAt: '2026-05-06T18:05:00.000Z'
          }
        }
      },
      { status: 404, label: 'Not found', body: { error: 'API key not found' } }
    ]
  },
  {
    id: 'config-get',
    tag: 'Config',
    title: 'Get programmable KYC config',
    description: 'Clerk Bearer only (`req.auth.userId`). Used by advanced tenant automation.',
    method: 'GET',
    path: '/config',
    auth: 'clerk',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: { success: true, config: { userId: 'user_xx', verificationSteps: {}, version: 1 } }
      },
      { status: 401, label: 'Unauthorized', body: { error: 'Unauthorized' } }
    ]
  },
  {
    id: 'config-patch',
    tag: 'Config',
    title: 'Patch KYC config',
    method: 'PATCH',
    path: '/config',
    auth: 'clerk',
    body: JSON.stringify({ verificationSteps: { requireIdCard: true } }, null, 2),
    responseExamples: [
      { status: 200, label: 'OK', body: { success: true, message: 'Configuration updated successfully' } },
      { status: 401, label: 'Unauthorized', body: { error: 'Unauthorized' } },
      {
        status: 404,
        label: 'Not found',
        body: {
          success: false,
          errorCode: 'NOT_FOUND'
        }
      },
      {
        status: 409,
        label: 'Version conflict',
        body: { error: 'Config modified. Refresh and try again.' }
      }
    ]
  },
  {
    id: 'config-presets',
    tag: 'Config',
    title: 'List presets',
    description:
      'Public list of named threshold bundles; applying still requires PATCH/preset authenticated calls.',
    method: 'GET',
    path: '/config/presets',
    auth: 'none',
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: {
          success: true,
          presets: [{ key: 'balanced', name: 'Balanced', description: 'Balanced thresholds for ID + selfie flows.' }]
        }
      }
    ]
  },
  {
    id: 'config-preset',
    tag: 'Config',
    title: 'Apply preset',
    method: 'POST',
    path: '/config/preset',
    auth: 'clerk',
    body: JSON.stringify({ preset: 'balanced' }, null, 2),
    responseExamples: [
      {
        status: 200,
        label: 'OK',
        body: { success: true, appliedPreset: 'balanced', config: { userId: 'user_xx', version: 2 } }
      },
      {
        status: 400,
        label: 'Invalid preset',
        body: { error: 'Invalid preset: balanced, aggressive, permissive, …' }
      },
      {
        status: 401,
        label: 'Unauthorized',
        body: { error: 'Unauthorized' }
      }
    ]
  }
];
