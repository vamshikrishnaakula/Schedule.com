import { normalizeEmailAddresses } from "@calcom/emails/lib/normalizeEmailAddresses";
import type { WorkflowEmailData } from "@calcom/emails/templates/workflow-email";
import { sendCustomWorkflowEmail } from "@calcom/emails/workflow-email-service";
import tasker from "@calcom/features/tasker";

type EmailData = Omit<WorkflowEmailData, "to"> & {
  to: string[];
} & { sendAt?: Date | null; includeCalendarEvent?: boolean; referenceUid?: string };

export async function sendOrScheduleWorkflowEmails(mailData: EmailData) {
  const normalizedRecipients = normalizeEmailAddresses(mailData.to);

  if (normalizedRecipients.length === 0) {
    console.warn("WORKFLOW_EMAIL_SKIPPED", "No valid recipients found for workflow email payload");
    return;
  }

  if (mailData.sendAt) {
    if (mailData.sendAt <= new Date()) return;
    const { sendAt, referenceUid, ...taskerData } = mailData;
    return await tasker.create(
      "sendWorkflowEmails",
      {
        ...taskerData,
        to: normalizedRecipients,
      },
      {
        scheduledAt: sendAt,
        referenceUid,
      }
    );
  } else {
    await Promise.all(
      normalizedRecipients.map((to) =>
        sendCustomWorkflowEmail({
          to,
          subject: mailData.subject,
          html: mailData.html,
          sender: mailData.sender,
          replyTo: mailData.replyTo,
          attachments: mailData.attachments,
        })
      )
    );
  }
}
