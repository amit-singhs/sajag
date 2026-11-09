BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AdminUser] (
    [id] NVARCHAR(36) NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [name] NVARCHAR(120) NOT NULL,
    [passwordHash] NVARCHAR(100) NOT NULL,
    [role] NVARCHAR(20) NOT NULL CONSTRAINT [AdminUser_role_df] DEFAULT 'owner',
    [isActive] BIT NOT NULL CONSTRAINT [AdminUser_isActive_df] DEFAULT 1,
    [lastLoginAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AdminUser_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AdminUser_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AdminUser_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Participant] (
    [id] NVARCHAR(36) NOT NULL,
    [campaignId] NVARCHAR(64) NOT NULL,
    [mobileHash] NVARCHAR(100) NOT NULL,
    [mobileEnc] NVARCHAR(400),
    [mobileMasked] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(120),
    [tehsil] NVARCHAR(80),
    [district] NVARCHAR(80),
    [ageBand] NVARCHAR(10) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Participant_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [scheduledErasureAt] DATETIME2,
    [erasureNoticeSentAt] DATETIME2,
    [erasedAt] DATETIME2,
    CONSTRAINT [Participant_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Consent] (
    [id] NVARCHAR(36) NOT NULL,
    [participantId] NVARCHAR(36) NOT NULL,
    [method] NVARCHAR(30) NOT NULL,
    [noticeVersion] NVARCHAR(20) NOT NULL,
    [language] NVARCHAR(5) NOT NULL,
    [guardianName] NVARCHAR(120),
    [guardianRelation] NVARCHAR(20),
    [guardianMobileHash] NVARCHAR(100),
    [guardianMobileEnc] NVARCHAR(400),
    [grantedAt] DATETIME2 NOT NULL CONSTRAINT [Consent_grantedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [withdrawnAt] DATETIME2,
    CONSTRAINT [Consent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Submission] (
    [id] NVARCHAR(36) NOT NULL,
    [participantId] NVARCHAR(36) NOT NULL,
    [campaignId] NVARCHAR(64) NOT NULL,
    [score] FLOAT(53) NOT NULL,
    [maxScore] FLOAT(53) NOT NULL,
    [answersJson] NVARCHAR(max) NOT NULL,
    [submittedAt] DATETIME2 NOT NULL CONSTRAINT [Submission_submittedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Submission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Submission_participantId_key] UNIQUE NONCLUSTERED ([participantId])
);

-- CreateTable
CREATE TABLE [dbo].[AnswerResult] (
    [id] NVARCHAR(36) NOT NULL,
    [submissionId] NVARCHAR(36) NOT NULL,
    [campaignId] NVARCHAR(64) NOT NULL,
    [questionId] NVARCHAR(64) NOT NULL,
    [isCorrect] BIT,
    [pointsAwarded] FLOAT(53) NOT NULL,
    CONSTRAINT [AnswerResult_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DataRequest] (
    [id] NVARCHAR(36) NOT NULL,
    [mobileHash] NVARCHAR(100) NOT NULL,
    [mobileMasked] NVARCHAR(20) NOT NULL,
    [type] NVARCHAR(20) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [DataRequest_status_df] DEFAULT 'open',
    [details] NVARCHAR(2000),
    [response] NVARCHAR(2000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DataRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [dueAt] DATETIME2 NOT NULL,
    [resolvedAt] DATETIME2,
    [resolvedById] NVARCHAR(64),
    CONSTRAINT [DataRequest_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OtpChallenge] (
    [id] NVARCHAR(36) NOT NULL,
    [mobileHash] NVARCHAR(100) NOT NULL,
    [purpose] NVARCHAR(30) NOT NULL,
    [codeHash] NVARCHAR(100) NOT NULL,
    [attempts] INT NOT NULL CONSTRAINT [OtpChallenge_attempts_df] DEFAULT 0,
    [expiresAt] DATETIME2 NOT NULL,
    [consumedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OtpChallenge_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OtpChallenge_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] NVARCHAR(36) NOT NULL,
    [actorId] NVARCHAR(36),
    [action] NVARCHAR(60) NOT NULL,
    [entity] NVARCHAR(40) NOT NULL,
    [entityId] NVARCHAR(64),
    [meta] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Participant_campaignId_mobileHash_idx] ON [dbo].[Participant]([campaignId], [mobileHash]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Participant_mobileHash_idx] ON [dbo].[Participant]([mobileHash]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Participant_campaignId_district_idx] ON [dbo].[Participant]([campaignId], [district]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Participant_scheduledErasureAt_idx] ON [dbo].[Participant]([scheduledErasureAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Consent_participantId_idx] ON [dbo].[Consent]([participantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Consent_grantedAt_idx] ON [dbo].[Consent]([grantedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Submission_campaignId_submittedAt_idx] ON [dbo].[Submission]([campaignId], [submittedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnswerResult_campaignId_questionId_idx] ON [dbo].[AnswerResult]([campaignId], [questionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnswerResult_submissionId_idx] ON [dbo].[AnswerResult]([submissionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DataRequest_status_dueAt_idx] ON [dbo].[DataRequest]([status], [dueAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DataRequest_mobileHash_idx] ON [dbo].[DataRequest]([mobileHash]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OtpChallenge_mobileHash_purpose_createdAt_idx] ON [dbo].[OtpChallenge]([mobileHash], [purpose], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_createdAt_idx] ON [dbo].[AuditLog]([createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[Consent] ADD CONSTRAINT [Consent_participantId_fkey] FOREIGN KEY ([participantId]) REFERENCES [dbo].[Participant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Submission] ADD CONSTRAINT [Submission_participantId_fkey] FOREIGN KEY ([participantId]) REFERENCES [dbo].[Participant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AnswerResult] ADD CONSTRAINT [AnswerResult_submissionId_fkey] FOREIGN KEY ([submissionId]) REFERENCES [dbo].[Submission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_actorId_fkey] FOREIGN KEY ([actorId]) REFERENCES [dbo].[AdminUser]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
