import ky from 'ky';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const kyInstance = ky.create({
    prefix: `${apiUrl}/api/v1`,
    credentials: "include",
    parseJson: (text) =>
        JSON.parse(text, (key, value) => {
            if (key.endsWith("At") && value !== null) return new Date(value);
            return value;
        })
});

export default kyInstance;
