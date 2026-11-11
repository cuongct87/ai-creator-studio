import tempfile,unittest
import council
from pathlib import Path
class CouncilTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();council.DB=Path(self.tmp.name)/"db.sqlite"
    def tearDown(self): self.tmp.cleanup()
    def test_two_agents_and_cross_review(self):
        calls=[]
        def fake(role,prompt):
            calls.append((role,prompt));return f"{role}: checked"
        ident=council.submit("Review ZUNVA design")
        self.assertEqual(council.run_one(fake),(ident,"completed"))
        self.assertEqual([x[0] for x in calls],["A","B","A","B"])
        self.assertIn("B: checked",calls[2][1]);self.assertIn("A: checked",calls[3][1])
        self.assertEqual(len(council.report(ident)["evidence"]),4)
        self.assertIsNone(council.run_one(fake))
    def test_failure_redacts_exception(self):
        ident=council.submit("task")
        def fail(role,prompt):raise ValueError("secret-do-not-log")
        self.assertEqual(council.run_one(fail)[1],"failed")
        self.assertNotIn("secret-do-not-log",str(council.report(ident)))
    def test_validation(self):
        with self.assertRaises(ValueError):council.submit(" ")
if __name__=="__main__":unittest.main()
