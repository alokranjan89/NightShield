import Contact from "../models/Contact.js";

// add contact
export const addContact = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();

    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// replace user contacts
export const replaceContacts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { contacts = [] } = req.body;

    await Contact.deleteMany({ userId });

    const sanitizedContacts = contacts.map((contact) => ({
      userId,
      contactUserId: contact.contactUserId || "",
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
      isPrimary: Boolean(contact.isPrimary),
    }));

    const savedContacts = sanitizedContacts.length
      ? await Contact.insertMany(sanitizedContacts)
      : [];

    res.json(savedContacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get user contacts
export const getContacts = async (req, res) => {
  try {
    const { userId } = req.params;

    const contacts = await Contact.find({ userId });

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
