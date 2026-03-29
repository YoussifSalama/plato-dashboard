import sgMail from "@sendgrid/mail";
import signupTemplate from "@/lib/email/templates/signupTemplate";
import verifyEmailTemplate from "@/lib/email/templates/verifyEmailTemplate";
import verifyAndWelcomeTemplate from "@/lib/email/templates/verifyAndWelcomeTemplate";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM = {
	email: process.env.SENDGRID_FROM_EMAIL!,
	name: process.env.SENDGRID_FROM_NAME ?? "Plato Hiring",
};

export async function sendWelcomeEmail(to: string, name: string) {
	await sgMail.send({
		to,
		from: FROM,
		subject: "Welcome to Plato Hiring",
		html: signupTemplate(name),
	});
}

export async function sendVerifyEmail(
	to: string,
	name: string,
	verifyEmailUrl: string
) {
	await sgMail.send({
		to,
		from: FROM,
		subject: "Verify your email — Plato Hiring",
		html: verifyEmailTemplate(name, verifyEmailUrl),
	});
}
export async function sendVerifyEmailAndWelcome(
	to: string,
	name: string,
	verifyEmailUrl: string
) {
	await sgMail.send({
		to,
		from: FROM,
		subject: "Verify your email — Plato Hiring",
		html: verifyAndWelcomeTemplate(name, verifyEmailUrl),
	});
}
