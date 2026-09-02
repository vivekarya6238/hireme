import logoImg from "../assets/logo.png";

export default function Logo({ size = 40 }) {
  return (
    <img
      src={logoImg}
      alt="HireMe logo"
      width={size}
      height={size}
      className="object-contain"
    />
  );
}